# CI/CD Visualization Dashboard

A lightweight, static web dashboard for the [5GASP](https://www.5gasp.eu/) project that visualizes the status and results of Network Application (NetApp) testing processes run by the [CI/CD Manager](https://github.com/5gasp/CICD_Manager) service.

It is a plain HTML/CSS/JavaScript (jQuery + Bootstrap) single-page-style app, served via nginx in Docker, that polls the CI/CD Manager's REST API and renders:

- The base information of a testing process (NetApp ID, Network Service ID, testbed, start time, overall pass/fail status)
- The step-by-step stages of the testing process and their outcomes
- The individual test cases that were executed (or skipped), with pass/fail status and links to their test log/report
- The console log of a testing process (for stages that failed)
- URLs (with access credentials) for the metrics and logs collected during the testing process

## How it works

Access to a testing process's data is scoped by a `test_id` + `access_token` pair, which is:

- Entered by the user on the login page (`website/index.html`), or
- Passed as URL query parameters (`?test_id=...&access_token=...`)

Once "logged in", the credentials are stored in browser cookies and reused across pages. The dashboard auto-refreshes the testing process status and test results every 10 seconds.

### Pages

| Page | File | Purpose |
|---|---|---|
| Login | `website/index.html` | Enter a Test ID + Access Token to view a testing process |
| Test Information | `website/test-information.html` | Main dashboard: base info, process stages, tests performed, collected logs/metrics |
| Console Log | `website/console-log.html` | Displays the console log for a failed stage |
| Test Files | `website/test-files.html` | Renders a specific test's output file (e.g. `log.html`, `report.html`) fetched from the CI/CD Manager |

### REST API endpoints consumed

Configured in `website/static/js/constants.js`, relative to a configurable `base_api` URL:

- `GET /gui/test-base-information`
- `GET /gui/testing-process-status`
- `GET /gui/tests-performed`
- `GET /gui/test-console-log`
- `GET /gui/test-output-file`
- `GET /gui/logs-and-metrics`

## Project structure

```
website/                   Static site served by nginx
  index.html                Login page
  test-information.html     Main dashboard page
  console-log.html          Console log viewer
  test-files.html           Test output file viewer
  static/
    js/
      urls.js                 Sets the base_api URL (edit this to point at your CI/CD Manager)
      constants.js             REST endpoint definitions
      utils.js                 Cookie handling, URL param parsing, login guard
      pages/                   Per-page logic (index, test-information, console-log, test-files)
    css/                     Page-specific styles
    assets/dist/             Bootstrap CSS/JS
    img/                     5GASP logo and favicon
docker/
  Dockerfile                 nginx-based image serving the website/ folder
  docker-compose.yaml        Compose service exposing the dashboard on a host port
  docker-entrypoint.sh        Standard nginx entrypoint
  nginx.conf                  nginx server config (gzip, static file serving)
  urls.js                      Template urls.js copied into the container (mounted, override this)
```

## Deployment

1. Edit `docker/urls.js` and set `base_api` to the URL of your running CI/CD Manager instance:

   ```js
   let base_api = "http://<cicd-manager-host>:8000";
   ```

2. From the `docker/` directory, build and start the service:

   ```bash
   docker compose up
   ```

   This builds an nginx image serving the contents of `website/`, with `docker/urls.js` mounted in to override `website/static/js/urls.js`.

3. The dashboard is exposed on host port `8001` by default (mapped to container port `80`). Edit the `ports` section of `docker/docker-compose.yaml` to change this if needed.

4. Open `http://<host>:8001` in a browser and log in with a valid Test ID and Access Token.

## Requirements

- Docker and Docker Compose
- A reachable instance of the [5GASP CI/CD Manager](https://github.com/5gasp/CICD_Manager) exposing the REST endpoints listed above

## License

See [LICENSE](CICD-VisualizationDashboard/LICENSE).
