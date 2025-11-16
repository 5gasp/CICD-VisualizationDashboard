/**
 * @Author: Rafael Direito
 * @Date:   2025-08-12 22:25:34
 * @Last Modified by:   Rafael Direito
 * @Last Modified time: 2025-08-12 22:49:03
 */
// On Load, load CUs
var test_id;
var access_token;
// Map to store large pipeline content
let pipelineContents = {};
let consoleLogContents = {};
let testingDescriptor = null;

window.onload = function () {
    checkLogin();
    test_id = findGetParameter("test_id");
    access_token = findGetParameter("access_token");
    if (test_id == null) test_id = getCookie('test_id');
    if (access_token == null) access_token = getCookie('access_token');
    get_test_base_info();
    get_test_process_stages();
    get_tests_performed();
    get_test_logs_and_metrics();
};

function logout() {
    deleteCookie("access_token");
    deleteCookie("test_id");
    // redirecting
    navigateTo(pages.index);
}

function refresh_results() {
    signalSuccessInObtainingResults();
    get_test_process_stages();
    get_tests_performed()
}

setInterval(refresh_results, 10000);

let num_test_process_stages = 0;
let num_performed_tests = 0;


function get_test_base_info() {
    $.ajax({
        type: "GET",
        url: rest_api.test_base_info,
        data: {
            "test_id": test_id,
            "access_token": access_token,
        },
    })
        .done(function (response) {
            if (response.success) {
                // Process Test Base Information
                testingDescriptor = response.data.test_instance.testing_descriptor;
                console.log(response.data.test_instance.testing_descriptor);
                $("#base_info_test_id").text(response.data.test_instance.test_id);
                $("#base_info_netapp_id").text(response.data.test_instance.netapp_id);
                $("#base_info_network_service_id").text(response.data.test_instance.network_service_id);
                $("#base_info_testbed").text(response.data.test_instance.testbed_id);
                $("#base_info_start_time").text(response.data.test_instance.started_at.split(".")[0]);
                if (response.data.test_instance.test_status)
                    $("#base_info_test_passed").show();
                else
                    $("#base_info_test_failed").show();

                // Process Test Stages
                $("#testing_agents_tbody").empty();
                for (let agent of response.data.test_agents) {
                    add_testing_stage_row("#testing_agents_tbody", agent)
                }
                return true;
            }
            else {
                signalErrorInObtainingResults()
            }
        })
        .fail(function () {
            signalErrorInObtainingResults()
        });

    return false;
}


function get_test_process_stages() {
    $.ajax({
        type: "GET",
        url: rest_api.test_stage_status,
        data: {
            "test_id": test_id,
            "access_token": access_token,
        },
    })
        .done(function (response) {
            if (response.success) {
                if (response.data.length != num_test_process_stages) {
                    $("#testing_process_status_tbody").empty();
                    for (let status of response.data) {
                        add_process_stage_row("#testing_process_status_tbody", status.timestamp, status.state, status.description, status.success)
                    }
                    num_test_process_stages = response.data.length
                }
                return true;
            }
            else {
                signalErrorInObtainingResults()
            }
        })
        .fail(function () {
            signalErrorInObtainingResults()
        });

    return false;
}


function get_tests_performed() {
    $.ajax({
        type: "GET",
        url: rest_api.tests_performed,
        data: {
            "test_id": test_id,
            "access_token": access_token,
        },
    })
        .done(function (response) {
            if (response.success) {
                if (response.data.length != 0) {
                    $("#tests_performed_tbody").empty();
                    $("#testing_process_stages_tbody").empty();

                    for (let test_stage of response.data) {
                        console.log(test_stage);
                        add_test_stage_performed_row("#tests_performed_tbody", test_stage);
                        add_stage_to_testing_stages_row("#testing_process_stages_tbody", test_stage)

                        for (let test_performed of test_stage.test_cases) {
                            add_test_performed_row("#tests_performed_tbody", test_performed.performed_test, test_stage.id, test_performed.description, test_performed.start_time, test_performed.end_time, test_performed.success)
                        }
                    }

                }
                return true;
            }
            else {
                signalErrorInObtainingResults()
            }
        })
        .fail(function () {
            signalErrorInObtainingResults()
        });

    return false;
}

function add_testing_stage_row(table_id, agent) {
    let id = agent.testing_agent_id;
    let type = agent.testing_agent_type;
    let performed_testing_stages = agent.performed_testing_stages;
    let performed_test_cases = agent.performed_test_cases;
    let name = agent.name;
    let service_order = agent.service_order;
    let url = agent.url;
    let username = agent.username;
    let password = agent.password;

    let row = `
    <tr>
        <td>${id}</td>
        <td>${type}</td>
        <td>${performed_testing_stages}</td>
        <td>${performed_test_cases}</td>
        <td>${name}</td>
        <td>${service_order}</td>
        <td><a href="${url}" target="_blank">${url}</a></td>
        <td>${username}</td>
        <td>${password}</td>
    </tr>
    `;

    $(table_id).append(row);

}


function add_stage_to_testing_stages_row(table_id, stage) {
    // Store pipeline content in JS map
    pipelineContents[stage.id] = stage.pipeline;
    consoleLogContents[stage.id] = stage.console_log;

    let row = `
        <tr style="background-color: #303030 !important; color:white !important; font-weight: bold;">
            <td>${stage.id}</td>
            <td>${stage.testing_agent_id}</td>
            <td>${stage.test_cases.length}</td>
            <td>
                <button type="button" class="btn btn-primary btn-md" 
                        data-bs-toggle="modal" 
                        data-bs-target="#testingPipelineModal"
                        data-stage-id="${stage.id}">
                    Testing Stage Pipeline
                </button>
            </td>
            <td>
                <button type="button" class="btn btn-primary btn-md" 
                        data-bs-toggle="modal" 
                        data-bs-target="#consoleLogModal"
                        data-stage-id="${stage.id}">
                    Testing Stage Execution Log
                </button>
            </td>
        </tr>
        <tr style="background-color: #484848 !important; color:white !important;">
            <td colspan="3">Timestamp</td>
            <td colspan="3">Testing Stage Status</td>
        </tr>
    `;
    $(table_id).append(row);

    let timestamp_splitted = null;
    let date = null;
    let time = null;


    for (let status of stage.statuses){
        timestamp_splitted = status.timestamp.split("T");
        date = timestamp_splitted[0];
        time = timestamp_splitted[1].split(".")[0];
        row = `
            <tr>
                <td colspan="3">${date} ${time}</td>
                <td colspan="2">${status.state}</td>
            </tr>
        `
        $(table_id).append(row);

    }
}


function add_process_stage_row(table_id, timestamp, stage_name, description, success) {
    let timestamp_splitted = timestamp.split("T");
    let date = timestamp_splitted[0]
    let time = timestamp_splitted[1].split(".")[0]
    stage_name = stage_name.toLowerCase();

    let statusClass = success ? "td_success" : "td_fail";
    let statusLabel = success ? "Success" : "Fail";
    let normalizedDescription = description ?? "No Observations";   // turns null/undefined into ""

    let row = `
        <tr>
            <td>${date}<br>${time}</td>
            <td>${stage_name.toUpperCase()}</td>
            <td class="${statusClass}">${statusLabel}</td>
            <td>${normalizedDescription}</td>
        </tr>
    `;
    $(table_id).append(row);
}


function get_test_logs_and_metrics() {
    $.ajax({
        type: "GET",
        url: rest_api.logs_and_metrics,
        data: {
            "test_id": test_id
        },
    })
        .done(function (response) {
            if (response.success) {
                if (response.data.length != num_test_process_stages) {
                    $("#metrics_collected_tbody").empty();
                    $("#logs_collected_tbody").empty();
                    for (let metric of response.data["metrics"]) {
                        let row = `<tr>
                            <td class="col-8"> <a target="_blank"
                            href="${metric.url}">
                            ${metric.url}</a>
                            </td>
                            <td class="col-2">${metric.access_username}</td>
                            <td class="col-2">${metric.access_password}</td>
                        '</tr>'`;
                        row += '</tr>'
                        $("#metrics_collected_tbody").append(row);
                    }
                    for (let log of response.data["logs"]) {
                        let row = `<tr>
                            <td class="col-8"> <a target="_blank"
                            href="${log.url}">
                            ${log.url}</a>
                            </td>
                            <td class="col-2">${log.access_username}</td>
                            <td class="col-2">${log.access_password}</td>
                        '</tr>'`;
                        row += '</tr>'
                        $("#logs_collected_tbody").append(row);
                    }
                }
                return true;
            }
            else {
                signalErrorInObtainingResults()
            }
        })
        .fail(function () {
            signalErrorInObtainingResults()
        });

    return false;
}



function add_test_performed_row(table_id, test_name, stage_id, description, start, end, success) {

    let id = test_name.split("-test-id-")[1]
    let test_name_simple = test_name.split("-test-id-")[0]

    if (success == null) {
        start = end = ["-", ""];
    }
    else {
        start = start.split(" ");
        end = end.split(" ");
    }

    let row = `<tr>
        <td>${id}</td>
        <td>${test_name_simple}</td>
        <td>${start[0]}<br>${start[1]}</td>
        <td>${end[0]}<br>${end[1]}</td>
    `
    if (success == null) {
        row += `<td class="td_not_executed">Not Executed</td>`;
        row += `<td>${description}</td>`;
        row += `<td class="td_not_executed_soft">No Test Log</td>`;
        row += `<td class="td_not_executed_soft">No Test Report</td>`;
    } else {
        if (success) {
            row += `<td class="td_success">Passed</td>`;
        } else {
            row += `<td class="td_fail">Failed</td>`;
        }
        row += `<td>${description}</td>`;
        row += `<td><a href="${rest_api.test_files}?file_name=log.html&test_id=${test_id}&stage_id=${stage_id}&test_name=${test_name}&access_token=${access_token}" target="_blank">Test Log</a></td>`;
        row += `<td><a href="${rest_api.test_files}?file_name=report.html&test_id=${test_id}&stage_id=${stage_id}&test_name=${test_name}&access_token=${access_token}" target="_blank">Test Report</a></td>`;

    }


    row += '</tr>'
    $(table_id).append(row);
}


// Add a row
function add_test_stage_performed_row(table_id, stage) {
    let row = `<tr style="background-color: #303030 !important; color:white !important; font-weight: bold;">
        <td colspan="12">Test Stage with ID ${stage.id}</td>
    </tr>`;
    $(table_id).append(row);
}

$('#testingPipelineModal').on('show.bs.modal', function (event) {
    let button = $(event.relatedTarget);
    let stageId = button.data('stage-id'); // Get stage ID
    let content = pipelineContents[stageId]; // Retrieve full pipeline content
    let modal = $(this);

    modal.find('.modal-body').text(content); // preserves formatting
});

$('#consoleLogModal').on('show.bs.modal', function (event) {
    let button = $(event.relatedTarget);
    let stageId = button.data('stage-id'); // Get stage ID
    let content = consoleLogContents[stageId]; // Retrieve full pipeline content
    let modal = $(this);

    modal.find('.modal-body').text(content); // preserves formatting
});

$('#testingDescriptorModal').on('show.bs.modal', function (event) {
    let button = $(event.relatedTarget);
    let content = testingDescriptor; // Retrieve full pipeline content
    let modal = $(this);

    modal.find('.modal-body').text(content); // preserves formatting
});


function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}


