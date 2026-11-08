from typing import Any
import base64
from urllib.parse import quote

from app.github.client import GithubClient,GithubAPIError


class GithubRepoService:

    MAX_FILE_SIZE = 30_000

    def __init__(self, client: GithubClient):
        self.client = client

    @staticmethod
    def _repository_path(repository: str, path: str) -> str:
        owner, separator, name = repository.partition("/")
        if not separator or not owner or not name or "/" in name:
            raise ValueError("repository must be in the format 'owner/repository'")

        return f"/repos/{quote(owner, safe='')}/{quote(name, safe='')}{path}"

    @staticmethod
    def _commit_summary(commit: dict[str, Any]) -> dict[str, Any]:
        details = commit.get("commit", {})
        author = details.get("author") or {}
        return {
            "sha": commit["sha"],
            "message": details.get("message"),
            "author": author.get("name"),
            "date": author.get("date"),
            "url": commit.get("html_url"),
        }

    async def list_repository_summaries(
        self,
    ) -> list[dict[str, Any]]:

        repositories = await self.list_repos()

        return [
            {
                "id": str(repo["id"]),
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo["description"],
                "created_at": repo["created_at"],
                "private": repo["private"],
                "default_branch": repo["default_branch"],
                "language": repo["language"],
                "stars": repo["stargazers_count"],
                "forks": repo["forks_count"],
                "url": repo["html_url"],
            }
            for repo in repositories
        ]

    async def list_repos(self) -> list[dict[str, Any]]:

        repos: list[dict[str, Any]] = []

        page = 1

        while True:
            data = await self.client.get(
                "/user/repos",
                params={
                    "per_page": 100,
                    "page": page,
                    "sort": "updated",
                    "direction": "desc",
                    "affiliation": "owner,collaborator,organization_member",
                },
            )

            if not data:
                break

            repos.extend(data)

            if len(data) < 100:
                break

            page += 1

        return repos

    async def get_repo_tree(
        self,
        repository: str,
        branch: str | None = None,
    ) -> dict[str, Any]:

        repo = await self.client.get(
            self._repository_path(repository, ""),
        )

        branch_name = branch or repo["default_branch"]

        branch_data = await self.client.get(
            self._repository_path(
                repository,
                f"/branches/{quote(branch_name, safe='')}",
            ),
        )

        commit_sha = branch_data["commit"]["sha"]

        tree = await self.client.get(
            self._repository_path(
                repository,
                f"/git/trees/{quote(commit_sha, safe='')}",
            ),
            params={
                "recursive": "1",
            },
        )

        entries = tree.get("tree", [])

        files = [
            item["path"]
            for item in entries
            if item["type"] == "blob"
        ]

        directories = [
            item["path"]
            for item in entries
            if item["type"] == "tree"
        ]

        return {
            "repository": repository,
            "branch": branch_name,
            "file_count": len(files),
            "directory_count": len(directories),
            "truncated": tree.get("truncated", False),
            "files": files,
            "directories": directories,
        }

    async def read_repo_file(
        self,
        repository: str,
        path: str,
        branch: str | None = None,
    ) -> dict[str, Any]:

        try:


            repo = await self.client.get(
                self._repository_path(
                    repository,
                    f"/contents/{quote(path, safe='/')}",
                ),
                params={
                    "ref": branch,
                } if branch else None,
            )

            if repo.get("type") != "file":
                raise ValueError(
                    f"'{path}' is not a file"
                )

            import base64

            encoded_content = repo.get("content", "")

            content = base64.b64decode(
                encoded_content
            ).decode("utf-8", errors="replace")

            truncated = len(content) > self.MAX_FILE_SIZE

            if truncated:
                content = content[:self.MAX_FILE_SIZE]

            return {
                "repository": repository,
                "path": path,
                "branch": branch,
                "size": repo.get("size", 0),
                "content": content,
            }

        except GithubAPIError  as exc:
            if "404" in str(exc):

                return {
                    "success": False,
                    "error": "FILE_NOT_FOUND",
                    "message": (
                        f"File '{path}' was not found in "
                        f"repository '{repository}'."
                    ),
                }

            raise


    async def search_repository_code(
        self,
        repository: str,
        query: str,
    ) -> dict[str, Any]:

        self._repository_path(repository, "")
        data = await self.client.get(
            "/search/code",
            params={
                "q": f"{query} repo:{repository}",
                "per_page": 30,
            },
        )

        results = []

        for item in data.get("items", []):
            results.append(
                {
                    "name": item["name"],
                    "path": item["path"],
                    "sha": item["sha"],
                    "url": item["html_url"],
                }
            )

        return {
            "success": True,
            "repository": repository,
            "query": query,
            "total_count": data.get("total_count", 0),
            "results": results,
        }


    async def create_repository_file(self, repository: str, path: str, content: str, message: str, branch: str) -> dict[str, Any]:

        data = await self.client.put(self._repository_path(
            repository,
            f"/contents/{quote(path, safe='/')}",
        ), json={
            "message":message,
            "content": base64.b64encode(content.encode("utf-8")).decode("utf-8"),
            "branch":branch
        })

        return {
            "success":True,
            "repository": repository,
            "path": path,
            "branch": branch,
            "commit":{
                "sha": data["commit"]["sha"],
                "message": data["commit"]["message"],
                "url": data["commit"]["url"]
            },
            "file":{
                "path":data["content"]["path"],
                "sha":data['content']['sha'],
            }
        }

    async def update_repository_file(
        self,
        repository: str,
        path: str,
        content: str,
        message: str,
        branch: str,
    ) -> dict[str, Any]:
        existing_file = await self.client.get(
            self._repository_path(
                repository,
                f"/contents/{quote(path, safe='/')}",
            ),
            params={"ref": branch},
        )

        if existing_file.get("type") != "file":
            raise ValueError(f"'{path}' is not a file")

        file_sha = existing_file.get("sha")
        if not file_sha:
            raise ValueError(f"GitHub did not return a SHA for '{path}'")

        data = await self.client.put(
            self._repository_path(
                repository,
                f"/contents/{quote(path, safe='/')}",
            ),
            json={
                "message": message,
                "content": base64.b64encode(
                    content.encode("utf-8")
                ).decode("utf-8"),
                "branch": branch,
                "sha": file_sha,
            },
        )

        return {
            "success": True,
            "repository": repository,
            "path": path,
            "branch": branch,
            "commit": {
                "sha": data["commit"]["sha"],
                "message": data["commit"]["message"],
                "url": data["commit"]["url"],
            },
            "file": {
                "path": data["content"]["path"],
                "sha": data["content"]["sha"],
            },
        }

    async def delete_repository_file(
        self,
        repository: str,
        path: str,
        message: str,
        branch: str,
    ) -> dict[str, Any]:
        content_path = self._repository_path(
            repository,
            f"/contents/{quote(path, safe='/')}",
        )
        existing_file = await self.client.get(
            content_path,
            params={"ref": branch},
        )

        if existing_file.get("type") != "file":
            raise ValueError(f"'{path}' is not a file")

        file_sha = existing_file.get("sha")
        if not file_sha:
            raise ValueError(f"GitHub did not return a SHA for '{path}'")

        data = await self.client.delete(
            content_path,
            json={
                "message": message,
                "sha": file_sha,
                "branch": branch,
            },
        )

        return {
            "success": True,
            "repository": repository,
            "path": path,
            "branch": branch,
            "commit": {
                "sha": data["commit"]["sha"],
                "message": data["commit"]["message"],
                "url": data["commit"]["html_url"],
            },
        }

    async def list_repository_branches(
        self,
        repository: str,
    ) -> list[dict[str, Any]]:
        branches: list[dict[str, Any]] = []
        page = 1
        repository_path = self._repository_path(repository, "/branches")

        while True:
            data = await self.client.get(
                repository_path,
                params={"per_page": 100, "page": page},
            )
            branches.extend(
                {
                    "name": branch["name"],
                    "sha": branch["commit"]["sha"],
                    "protected": branch["protected"],
                }
                for branch in data
            )
            if len(data) < 100:
                return branches
            page += 1

    async def create_repository_branch(
        self,
        repository: str,
        branch: str,
        source_branch: str | None = None,
    ) -> dict[str, Any]:
        repository_path = self._repository_path(repository, "")
        repo_data = await self.client.get(repository_path)
        source = source_branch or repo_data["default_branch"]
        source_data = await self.client.get(
            self._repository_path(
                repository,
                f"/branches/{quote(source, safe='')}",
            )
        )

        if not branch or branch.startswith("refs/"):
            raise ValueError("branch must be a branch name, not a full ref")

        data = await self.client.post(
            self._repository_path(repository, "/git/refs"),
            json={
                "ref": f"refs/heads/{branch}",
                "sha": source_data["commit"]["sha"],
            },
        )
        return {
            "success": True,
            "repository": repository,
            "branch": data["ref"].removeprefix("refs/heads/"),
            "sha": data["object"]["sha"],
            "source_branch": source,
        }

    async def delete_repository_branch(
        self,
        repository: str,
        branch: str,
    ) -> dict[str, Any]:
        repository_data = await self.client.get(
            self._repository_path(repository, "")
        )
        if branch == repository_data["default_branch"]:
            raise ValueError("The repository's default branch cannot be deleted")

        await self.client.delete(
            self._repository_path(
                repository,
                f"/git/refs/heads/{quote(branch, safe='')}",
            )
        )
        return {
            "success": True,
            "repository": repository,
            "deleted_branch": branch,
        }

    async def list_repository_commits(
        self,
        repository: str,
        branch: str | None = None,
        limit: int = 30,
    ) -> dict[str, Any]:
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")

        data = await self.client.get(
            self._repository_path(repository, "/commits"),
            params={
                "sha": branch,
                "per_page": limit,
                "page": 1,
            },
        )
        return {
            "repository": repository,
            "branch": branch,
            "count": len(data),
            "commits": [self._commit_summary(commit) for commit in data],
        }

    async def create_repository_commit(
        self,
        repository: str,
        branch: str,
        message: str,
        changes: list[dict[str, str]],
    ) -> dict[str, Any]:
        if not changes:
            raise ValueError("At least one file change is required")

        branch_data = await self.client.get(
            self._repository_path(
                repository,
                f"/branches/{quote(branch, safe='')}",
            )
        )
        parent_sha = branch_data["commit"]["sha"]
        parent_commit = await self.client.get(
            self._repository_path(
                repository,
                f"/git/commits/{quote(parent_sha, safe='')}",
            )
        )

        paths: set[str] = set()
        tree_entries = []
        for change in changes:
            path = change.get("path", "")
            content = change.get("content")
            if (
                not path
                or path.startswith("/")
                or ".." in path.split("/")
                or content is None
            ):
                raise ValueError(
                    "Each change must have a safe relative path and content"
                )
            if path in paths:
                raise ValueError(f"Duplicate file path in changes: '{path}'")
            paths.add(path)

            blob = await self.client.post(
                self._repository_path(repository, "/git/blobs"),
                json={"content": content, "encoding": "utf-8"},
            )
            tree_entries.append(
                {
                    "path": path,
                    "mode": "100644",
                    "type": "blob",
                    "sha": blob["sha"],
                }
            )

        tree = await self.client.post(
            self._repository_path(repository, "/git/trees"),
            json={
                "base_tree": parent_commit["tree"]["sha"],
                "tree": tree_entries,
            },
        )
        commit = await self.client.post(
            self._repository_path(repository, "/git/commits"),
            json={
                "message": message,
                "tree": tree["sha"],
                "parents": [parent_sha],
            },
        )
        await self.client.patch(
            self._repository_path(
                repository,
                f"/git/refs/heads/{quote(branch, safe='')}",
            ),
            json={"sha": commit["sha"], "force": False},
        )

        return {
            "success": True,
            "repository": repository,
            "branch": branch,
            "commit": {
                "sha": commit["sha"],
                "message": commit["message"],
                "url": commit["html_url"],
            },
            "files": sorted(paths),
        }

    async def get_repository_commit(
        self,
        repository: str,
        commit_sha: str,
    ) -> dict[str, Any]:
        data = await self.client.get(
            self._repository_path(
                repository,
                f"/commits/{quote(commit_sha, safe='')}",
            )
        )
        summary = self._commit_summary(data)
        summary["stats"] = data.get("stats")
        summary["files"] = [
            {
                "filename": file["filename"],
                "status": file["status"],
                "additions": file["additions"],
                "deletions": file["deletions"],
                "changes": file["changes"],
                "patch": file.get("patch"),
            }
            for file in data.get("files", [])
        ]
        return {"repository": repository, "commit": summary}

    async def list_repository_pull_requests(
        self,
        repository: str,
        state: str = "open",
        limit: int = 30,
    ) -> dict[str, Any]:
        if state not in {"open", "closed", "all"}:
            raise ValueError("state must be 'open', 'closed', or 'all'")
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")

        data = await self.client.get(
            self._repository_path(repository, "/pulls"),
            params={"state": state, "per_page": limit, "page": 1},
        )
        return {
            "repository": repository,
            "count": len(data),
            "pull_requests": [self._pull_request_summary(pr) for pr in data],
        }

    @staticmethod
    def _pull_request_summary(pull_request: dict[str, Any]) -> dict[str, Any]:
        return {
            "number": pull_request["number"],
            "title": pull_request["title"],
            "state": pull_request["state"],
            "draft": pull_request.get("draft", False),
            "head": pull_request["head"]["ref"],
            "base": pull_request["base"]["ref"],
            "url": pull_request["html_url"],
            "body": pull_request.get("body"),
            "merged": pull_request.get("merged"),
        }

    async def get_repository_pull_request(
        self,
        repository: str,
        pull_number: int,
    ) -> dict[str, Any]:
        data = await self.client.get(
            self._repository_path(repository, f"/pulls/{pull_number}")
        )
        return {
            "repository": repository,
            "pull_request": self._pull_request_summary(data),
        }

    async def list_repository_pull_request_files(
        self,
        repository: str,
        pull_number: int,
    ) -> dict[str, Any]:
        files: list[dict[str, Any]] = []
        page = 1
        endpoint = self._repository_path(
            repository,
            f"/pulls/{pull_number}/files",
        )

        while True:
            data = await self.client.get(
                endpoint,
                params={"per_page": 100, "page": page},
            )
            files.extend(
                {
                    "filename": file["filename"],
                    "status": file["status"],
                    "additions": file["additions"],
                    "deletions": file["deletions"],
                    "changes": file["changes"],
                    "patch": file.get("patch"),
                }
                for file in data
            )
            if len(data) < 100:
                return {
                    "repository": repository,
                    "pull_number": pull_number,
                    "count": len(files),
                    "files": files,
                }
            page += 1

    async def list_repository_pull_request_reviews(
        self,
        repository: str,
        pull_number: int,
    ) -> dict[str, Any]:
        reviews: list[dict[str, Any]] = []
        endpoint = self._repository_path(
            repository,
            f"/pulls/{pull_number}/reviews",
        )
        page = 1
        while True:
            data = await self.client.get(
                endpoint,
                params={"per_page": 100, "page": page},
            )
            reviews.extend(data)
            if len(data) < 100:
                break
            page += 1

        return {
            "repository": repository,
            "pull_number": pull_number,
            "reviews": [
                {
                    "id": review["id"],
                    "user": review["user"]["login"],
                    "state": review["state"],
                    "body": review.get("body"),
                    "submitted_at": review.get("submitted_at"),
                    "url": review["html_url"],
                }
                for review in reviews
            ],
        }

    async def submit_repository_pull_request_review(
        self,
        repository: str,
        pull_number: int,
        event: str,
        body: str = "",
    ) -> dict[str, Any]:
        event = event.upper()
        if event not in {"APPROVE", "REQUEST_CHANGES", "COMMENT"}:
            raise ValueError(
                "event must be 'APPROVE', 'REQUEST_CHANGES', or 'COMMENT'"
            )
        if event != "APPROVE" and not body.strip():
            raise ValueError("A review comment is required for this event")

        data = await self.client.post(
            self._repository_path(
                repository,
                f"/pulls/{pull_number}/reviews",
            ),
            json={"event": event, "body": body},
        )
        return {
            "success": True,
            "repository": repository,
            "pull_number": pull_number,
            "review": {
                "id": data["id"],
                "state": data["state"],
                "body": data.get("body"),
                "url": data["html_url"],
            },
        }

    async def create_repository_pull_request(
        self,
        repository: str,
        title: str,
        head: str,
        base: str,
        body: str = "",
        draft: bool = False,
    ) -> dict[str, Any]:
        data = await self.client.post(
            self._repository_path(repository, "/pulls"),
            json={
                "title": title,
                "head": head,
                "base": base,
                "body": body,
                "draft": draft,
            },
        )
        return {
            "success": True,
            "repository": repository,
            "pull_request": self._pull_request_summary(data),
        }

    async def update_repository_pull_request(
        self,
        repository: str,
        pull_number: int,
        title: str | None = None,
        body: str | None = None,
        state: str | None = None,
        base: str | None = None,
    ) -> dict[str, Any]:
        updates = {
            key: value
            for key, value in {
                "title": title,
                "body": body,
                "state": state,
                "base": base,
            }.items()
            if value is not None
        }
        if not updates:
            raise ValueError("At least one pull request field must be provided")
        if state is not None and state not in {"open", "closed"}:
            raise ValueError("state must be 'open' or 'closed'")

        data = await self.client.patch(
            self._repository_path(repository, f"/pulls/{pull_number}"),
            json=updates,
        )
        return {
            "success": True,
            "repository": repository,
            "pull_request": self._pull_request_summary(data),
        }

    async def merge_repository_pull_request(
        self,
        repository: str,
        pull_number: int,
        merge_method: str = "merge",
        commit_title: str | None = None,
        commit_message: str | None = None,
    ) -> dict[str, Any]:
        if merge_method not in {"merge", "squash", "rebase"}:
            raise ValueError("merge_method must be 'merge', 'squash', or 'rebase'")
        payload: dict[str, Any] = {"merge_method": merge_method}
        if commit_title is not None:
            payload["commit_title"] = commit_title
        if commit_message is not None:
            payload["commit_message"] = commit_message

        data = await self.client.put(
            self._repository_path(repository, f"/pulls/{pull_number}/merge"),
            json=payload,
        )
        return {
            "success": data["merged"],
            "repository": repository,
            "pull_number": pull_number,
            "sha": data.get("sha"),
            "message": data.get("message"),
        }

    async def comment_on_repository_pull_request(
        self,
        repository: str,
        pull_number: int,
        comment: str,
    ) -> dict[str, Any]:
        data = await self.client.post(
            self._repository_path(repository, f"/issues/{pull_number}/comments"),
            json={"body": comment},
        )
        return {
            "success": True,
            "repository": repository,
            "pull_number": pull_number,
            "comment_id": data["id"],
            "url": data["html_url"],
        }


      
