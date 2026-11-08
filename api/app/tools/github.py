from langchain_core.tools import tool

from app.github.client import GithubClient
from app.github.repositories import GithubRepoService


@tool
async def get_repository_tree(
    repository: str,
    branch: str | None = None,
) -> dict:
    """
    Get the complete file and directory structure of a GitHub repository.

    repository must be in the format 'owner/repository'.

    Use this tool when you need to inspect the structure of a repository,
    understand what files and directories exist, or determine which files
    may be relevant before reading or modifying them.

    If branch is not provided, the repository's default branch is used.
    """
    client = GithubClient()
    service = GithubRepoService(client)

    return await service.get_repo_tree(
        repository=repository,
        branch=branch,
    )


@tool
async def read_repository_file(
    repository: str,
    path: str,
    branch: str | None = None,
) -> dict:
    """
    Read the contents of a file from a GitHub repository.

    repository must be in the format 'owner/repository'.

    Use this tool when you need to inspect the actual contents of a
    repository file.

    Do not use this tool for directories. Use get_repository_tree
    first to understand the repository structure.

    If branch is not provided, the repository's default branch is used.
    """
    client = GithubClient()
    service = GithubRepoService(client)

    return await service.read_repo_file(
        repository=repository,
        path=path,
        branch=branch,
    )

@tool
async def search_repository_code(
    repository: str,
    query: str,
) -> dict:
    """
    Search for code or text within a specific GitHub repository.

    repository must be in the format 'owner/repository'.

    Use this tool when you need to find where a function, class,
    variable, API endpoint, configuration, library, or specific
    piece of code is implemented.

    Use the search results to identify relevant files, then use
    read_repository_file to inspect their contents.
    """
    client = GithubClient()
    service = GithubRepoService(client)

    return await service.search_repository_code(
        repository=repository,
        query=query,
    )

@tool
async def create_repository_file(repository:str, path:str, content:str, message:str, branch:str) -> dict:
    """
    Create a new file in github repository.
    Repository must be in the format 'owner/reposiitory'.
    Use this tool when the user explicitly asks to create a new file.

    Before using this tool, check whether the file already exists.
    Do not overwrite an existing file with this tool.
    Use update_repository_file for existing files.

    The operation creates a git commit on the specified branch.
    """

    client = GithubClient()
    service = GithubRepoService(client)

    return await service.create_repository_file(repository=repository, path=path, content=content, message=message, branch=branch)


@tool
async def update_repository_file(
    repository: str,
    path: str,
    content: str,
    message: str,
    branch: str,
) -> dict:
    """
    Update an existing file in a GitHub repository.

    repository must be in the format 'owner/repository'. Use this tool
    only when the target file already exists and the user requested a change.
    Read the existing file before updating it. The operation creates a git
    commit on the specified branch.
    """
    client = GithubClient()
    service = GithubRepoService(client)

    return await service.update_repository_file(
        repository=repository,
        path=path,
        content=content,
        message=message,
        branch=branch,
    )


@tool
async def delete_repository_file(
    repository: str,
    path: str,
    message: str,
    branch: str,
) -> dict:
    """Delete a file and commit the deletion on the specified branch.

    Only use this when the user explicitly requests deleting this file.
    """
    service = GithubRepoService(GithubClient())
    return await service.delete_repository_file(
        repository=repository,
        path=path,
        message=message,
        branch=branch,
    )


@tool
async def list_repository_branches(repository: str) -> list[dict]:
    """List branch names, latest commit SHAs, and protection status."""
    service = GithubRepoService(GithubClient())
    return await service.list_repository_branches(repository)


@tool
async def create_repository_branch(
    repository: str,
    branch: str,
    source_branch: str | None = None,
) -> dict:
    """Create a branch from a source branch (the default branch if omitted)."""
    service = GithubRepoService(GithubClient())
    return await service.create_repository_branch(
        repository=repository,
        branch=branch,
        source_branch=source_branch,
    )


@tool
async def delete_repository_branch(repository: str, branch: str) -> dict:
    """Delete a branch. Only use when the user explicitly requests deletion."""
    service = GithubRepoService(GithubClient())
    return await service.delete_repository_branch(repository, branch)


@tool
async def list_repository_commits(
    repository: str,
    branch: str | None = None,
    limit: int = 30,
) -> dict:
    """List recent commits, optionally limited to a branch (maximum 100)."""
    service = GithubRepoService(GithubClient())
    return await service.list_repository_commits(
        repository=repository,
        branch=branch,
        limit=limit,
    )


@tool
async def create_repository_commit(
    repository: str,
    branch: str,
    message: str,
    changes: list[dict[str, str]],
) -> dict:
    """Commit multiple new or updated files together on an existing branch.

    Each change must contain a repository-relative `path` and complete UTF-8
    `content`. Read existing files before including updated contents.
    """
    service = GithubRepoService(GithubClient())
    return await service.create_repository_commit(
        repository=repository,
        branch=branch,
        message=message,
        changes=changes,
    )


@tool
async def get_repository_commit(repository: str, commit_sha: str) -> dict:
    """Get commit metadata, changed files, and available patch text."""
    service = GithubRepoService(GithubClient())
    return await service.get_repository_commit(repository, commit_sha)


@tool
async def list_repository_pull_requests(
    repository: str,
    state: str = "open",
    limit: int = 30,
) -> dict:
    """List pull requests in open, closed, or all state (maximum 100)."""
    service = GithubRepoService(GithubClient())
    return await service.list_repository_pull_requests(
        repository=repository,
        state=state,
        limit=limit,
    )


@tool
async def get_repository_pull_request(
    repository: str,
    pull_number: int,
) -> dict:
    """Get details for one pull request by its number."""
    service = GithubRepoService(GithubClient())
    return await service.get_repository_pull_request(repository, pull_number)


@tool
async def list_repository_pull_request_files(
    repository: str,
    pull_number: int,
) -> dict:
    """List files changed by a pull request, including available patches."""
    service = GithubRepoService(GithubClient())
    return await service.list_repository_pull_request_files(
        repository,
        pull_number,
    )


@tool
async def list_repository_pull_request_reviews(
    repository: str,
    pull_number: int,
) -> dict:
    """List submitted reviews for a pull request."""
    service = GithubRepoService(GithubClient())
    return await service.list_repository_pull_request_reviews(
        repository,
        pull_number,
    )


@tool
async def submit_repository_pull_request_review(
    repository: str,
    pull_number: int,
    event: str,
    body: str = "",
) -> dict:
    """Submit an APPROVE, REQUEST_CHANGES, or COMMENT review.

    Only submit a review when the user explicitly asks you to do so.
    """
    service = GithubRepoService(GithubClient())
    return await service.submit_repository_pull_request_review(
        repository=repository,
        pull_number=pull_number,
        event=event,
        body=body,
    )


@tool
async def create_repository_pull_request(
    repository: str,
    title: str,
    head: str,
    base: str,
    body: str = "",
    draft: bool = False,
) -> dict:
    """Open a pull request from head into base after the user asks for one."""
    service = GithubRepoService(GithubClient())
    return await service.create_repository_pull_request(
        repository=repository,
        title=title,
        head=head,
        base=base,
        body=body,
        draft=draft,
    )


@tool
async def update_repository_pull_request(
    repository: str,
    pull_number: int,
    title: str | None = None,
    body: str | None = None,
    state: str | None = None,
    base: str | None = None,
) -> dict:
    """Update a pull request title, body, state, or base branch."""
    service = GithubRepoService(GithubClient())
    return await service.update_repository_pull_request(
        repository=repository,
        pull_number=pull_number,
        title=title,
        body=body,
        state=state,
        base=base,
    )


@tool
async def merge_repository_pull_request(
    repository: str,
    pull_number: int,
    merge_method: str = "merge",
    commit_title: str | None = None,
    commit_message: str | None = None,
) -> dict:
    """Merge a pull request. Only use when the user explicitly asks to merge."""
    service = GithubRepoService(GithubClient())
    return await service.merge_repository_pull_request(
        repository=repository,
        pull_number=pull_number,
        merge_method=merge_method,
        commit_title=commit_title,
        commit_message=commit_message,
    )


@tool
async def comment_on_repository_pull_request(
    repository: str,
    pull_number: int,
    comment: str,
) -> dict:
    """Post an issue-style comment on a pull request."""
    service = GithubRepoService(GithubClient())
    return await service.comment_on_repository_pull_request(
        repository=repository,
        pull_number=pull_number,
        comment=comment,
    )