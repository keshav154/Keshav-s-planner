# Keshav's Planner - Deploy Guide

This README contains concise, reproducible steps to build Docker images for frontend and backend, push them to a container registry, and deploy to Kubernetes using the included Helm charts.

Prerequisites
- Docker (build & push)
- kubectl configured to your cluster
- Helm 3

Build images
- Frontend (adjust BUILD_DIR if your build output is not `dist`):
  docker build -t <REGISTRY>/frontend:<TAG> -f frontend/Dockerfile --build-arg BUILD_DIR=dist frontend/

- Backend:
  docker build -t <REGISTRY>/backend:<TAG> -f backend/Dockerfile backend/

Push images
- docker push <REGISTRY>/frontend:<TAG>
- docker push <REGISTRY>/backend:<TAG>

Helm deploy
- Edit chart values if needed:
  - frontend/chart/values.yaml -> image.repository, image.tag, ingress settings
  - backend/chart/values.yaml -> image.repository, image.tag, ingress settings

- Install or upgrade:
  helm upgrade --install planner-frontend ./frontend/chart \
    --set image.repository=<REGISTRY>/frontend,image.tag=<TAG>

  helm upgrade --install planner-backend ./backend/chart \
    --set image.repository=<REGISTRY>/backend,image.tag=<TAG>

Run locally (no push)
- Build local images:
  - Frontend:
    docker build -t frontend:local -f frontend/Dockerfile frontend/
  - Backend:
    docker build -t backend:local -f backend/Dockerfile backend/

- Deploy options (pick one depending on your local cluster):

  1) Docker Desktop Kubernetes (shared Docker daemon)
     helm upgrade --install planner-frontend ./frontend/chart \
       --set image.repository=frontend,image.tag=local,image.pullPolicy=Never

     helm upgrade --install planner-backend ./backend/chart \
       --set image.repository=backend,image.tag=local,image.pullPolicy=Never

  2) minikube
     # load built images into minikube
     minikube image load frontend:local
     minikube image load backend:local

     helm upgrade --install planner-frontend ./frontend/chart \
       --set image.repository=frontend,image.tag=local,image.pullPolicy=IfNotPresent

     helm upgrade --install planner-backend ./backend/chart \
       --set image.repository=backend,image.tag=local,image.pullPolicy=IfNotPresent

  3) kind
     # load built images into kind cluster named "kind"
     kind load docker-image frontend:local --name kind
     kind load docker-image backend:local --name kind

     helm upgrade --install planner-frontend ./frontend/chart \
       --set image.repository=frontend,image.tag=local,image.pullPolicy=IfNotPresent

     helm upgrade --install planner-backend ./backend/chart \
       --set image.repository=backend,image.tag=local,image.pullPolicy=IfNotPresent

Run on k3s (Raspberry Pi)
- Determine Pi architecture (on the Pi):
  uname -m
  # common outputs: armv7l (32-bit), aarch64 (64-bit)

- Option A: Build directly on the Pi (simplest)
  # build images on the Pi itself (matches architecture)
  docker build -t frontend:local -f frontend/Dockerfile frontend/
  docker build -t backend:local -f backend/Dockerfile backend/

- Option B: Cross-build from another machine using docker buildx
  # create and use buildx builder once:
  docker buildx create --use --name mybuilder
  docker buildx inspect --bootstrap
  # build images for Pi (example arm/v7). Use --load to load into local docker daemon (single-platform).
  docker buildx build --platform linux/arm/v7 -t frontend:local -f frontend/Dockerfile frontend/ --load
  docker buildx build --platform linux/arm/v7 -t backend:local -f backend/Dockerfile backend/ --load
  # adjust --platform to aarch64 if your Pi is 64-bit.

- Import images into k3s (containerd)
  # save and import (from machine that has access to k3s or run on the Pi)
  docker save frontend:local -o frontend.tar
  docker save backend:local -o backend.tar
  # on the Pi (where k3s runs) import into k3s containerd:
  sudo k3s ctr images import frontend.tar
  sudo k3s ctr images import backend.tar
  # or stream directly:
  docker save frontend:local | sudo k3s ctr images import -
  docker save backend:local | sudo k3s ctr images import -

- Helm deploy (use IfNotPresent after importing)
  helm upgrade --install planner-frontend ./frontend/chart \
    --set image.repository=frontend,image.tag=local,image.pullPolicy=IfNotPresent

  helm upgrade --install planner-backend ./backend/chart \
    --set image.repository=backend,image.tag=local,image.pullPolicy=IfNotPresent

Notes for k3s on Raspberry Pi
- If you build images directly on the Pi, you can skip the save/import steps and use image.pullPolicy=Never when the cluster shares the same daemon.
- For multi-node Pi clusters, import the images into every node or run a local registry and push images there.
  - Quick local registry option: run registry on Pi, push images, set image.repository to <pi-ip>:5000/<image>.
- Ensure container ports and health endpoints match your app and Helm values (backend default port 3000).
- Troubleshooting:
  - If pods cannot pull images: check image name/tag and that images are present in k3s (sudo k3s ctr images ls).
  - If architecture mismatch: rebuild with the appropriate --platform (arm/v7 or linux/arm64).

Notes
- Use imagePullPolicy=Never when the cluster can access your local daemon directly; use IfNotPresent when images are loaded into the cluster (minikube/kind).
- Confirm image names in Helm values match the local image names you built.
- Verify: kubectl get pods, kubectl logs <pod>, kubectl port-forward svc/<service> <local>:<svc-port>

Notes & tips
- Frontend: If your build output folder is different, pass --build-arg BUILD_DIR=<dir> during docker build and update nginx/static files if necessary.
- Backend: The Dockerfile uses `npm start` in production; ensure package.json defines the start script and binds to the container port (default 3000).
- Health endpoints: Backend Helm probes expect /health; update templates or app accordingly.
- To expose via Ingress, enable ingress in each chart's values.yaml and set hosts/annotations as needed.
- To inspect deployment: kubectl get pods, kubectl logs <pod-name>, kubectl port-forward svc/<service> <local>:<svc-port>

Minimal troubleshooting
- Image pull errors: confirm registry credentials and image.tag.
- CrashLoop: check liveness/readiness endpoints and environment variables required by your services.

That's it — set your registry and tags, push images, then run the helm commands above.

Push changes to GitHub (HTTPS)
- Check remote and current branch:
  git remote -v
  git branch --show-current

- Create a branch and commit:
  git checkout -b my-changes
  git add -A
  git commit -m "Describe your changes"

- Push over HTTPS:
  git push -u origin my-changes
  # Git will prompt for credentials. Since GitHub no longer accepts account passwords,
  # use one of the options below to authenticate.

Authentication options
1) GitHub CLI (recommended)
   gh auth login --web
   # Follow the browser flow; then run git push again.

2) Personal Access Token (PAT)
   - Create a token at https://github.com/settings/tokens with 'repo' scope.
   - When git prompts for username, enter your GitHub username.
   - When it prompts for password, paste the PAT.
   - Optionally cache credentials:
     git config --global credential.helper store   # stores permanently (insecure on shared machines)
     git config --global credential.helper cache   # caches in memory for some time

3) Switch to SSH (avoid HTTPS auth prompts)
   # generate key (if you don't have one)
   ssh-keygen -t ed25519 -C "your-email@example.com"
   # copy the public key and add it to GitHub -> Settings -> SSH and GPG keys
   # update remote to use SSH
   git remote set-url origin git@github.com:<OWNER>/<REPO>.git
   git push -u origin my-changes

Notes
- If push is rejected because remote has changes: git pull --rebase origin main (or the target branch), resolve conflicts, then push.
- For forks: push to your fork remote (origin) and open a PR against upstream.
- For quick debugging of image/deploy issues use: kubectl get pods, kubectl logs <pod> and the k3s image import steps in this README.
