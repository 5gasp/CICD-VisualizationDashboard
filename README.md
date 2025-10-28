# CI/CD Visualization Dashboard

This repository holds the 5GASP's CI/CD Service Visualization Dashboard. This dashboard consumes the [CI/CD Manager](https://github.com/5gasp/CICD_Manager) REST API and displays:

* The various steps of a testing process
* The outcomes/results of each test case included in a testing process
* URLs for accessing the metrics and logs collected during Network Application testing processes

## Deployment

To deploy the CI/CD Service Visualization Dashboard you must first update the file `docker/urls.js` to reflect the URL of the CI/CD Manager. After doing so, you may run `docker compose up`, from within the folder `docker`. 

You can also update the `docker-compose.yaml` file to change the port on which the dashboard is exposed, even though this is not mandatory