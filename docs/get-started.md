# Getting Started with the gittuf Metadata Visualizer

The visualizer consists of a frontend and backend, which must both be built and
run in order to use the visualizer. You may do this via a Docker container, or
manually.

## Running with Docker

Ensure that you have [Docker] installed on your computer before proceeding.

### Frontend

```bash
docker compose up --build
# App at http://localhost:3000
# Backend at http://localhost:8080
```

If you build just the backend image directly, use the backend directory as the
build context:

```bash
docker build -t visualizer-go-backend ./go-backend
```

## Manual Setup

Ensure that you have both [npm] and [Go] installed on your computer before
proceeding.

### Backend

First, start the backend:

Go (Gin) on port 8080:

```bash
cd go-backend
go mod download
go run cmd/server/main.go
```

### Frontend

Next, start the frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev
```

Or export it once:

```bash
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
npm run dev                # http://localhost:3000
```

Open http://localhost:3000 and follow the UI to fetch a repository, browse
commits, view/compare metadata, and analyze changes.

## Frontend usage

From the home page:

1. Enter a repository:
   - Remote: full Git URL (e.g., `https://github.com/gittuf/gittuf.git`)
   - Local: absolute path to a local Git repo
2. Click “Fetch Repository” to load commits.
3. Explore tabs:
   - Commits — browse commit list
   - Visualization — interactive JSON tree
   - Compare — diff metadata between two commits
   - Analysis — summary charts of changes over time
4. Switch between `root.json` and `targets.json` when supported.

[Docker]: https://docs.docker.com/engine/install/
[npm]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[Go]: https://go.dev/doc/install
