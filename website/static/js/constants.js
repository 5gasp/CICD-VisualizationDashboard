/**
 * @Author: Rafael Direito
 * @Date:   2025-08-12 22:25:34
 * @Last Modified by:   Rafael Direito
 * @Last Modified time: 2025-08-12 22:41:10
 */
const rest_api = {
    test_base_info: `${base_api}/gui/test-base-information`,
    test_stage_status: `${base_api}/gui/testing-process-status`,
    tests_performed: `${base_api}/gui/tests-performed`,
    console_log: `${base_api}/gui/test-console-log`,
    test_files: `${base_api}/gui/test-output-file`,
    logs_and_metrics: `${base_api}/gui/logs-and-metrics`
};

let pages = {
    test_info: "test-information.html",
    index: "index.html",
    console_log: "console-log.html",
    test_files: "test-files.html",
};