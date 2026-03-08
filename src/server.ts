import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Tools
import {
  QueryEndpointsInput, QuerySensorDataInput, GetQuestionResultsInput,
  queryEndpoints, querySensorData, getQuestionResults,
} from './tools/endpoint-query.js';
import {
  SearchSensorsInput, GetSensorInput, HarvestSensorInput,
  searchSensorsHandler, getSensor, harvestSensor,
} from './tools/sensor-discovery.js';
import {
  SearchPackagesInput, GetPackageInput, CreatePackageInput, UpdatePackageInput, DeletePackageInput,
  searchPackagesHandler, getPackage, createPackageHandler, updatePackageHandler, deletePackageHandler,
} from './tools/package-management.js';
import {
  CreateSensorInput, UpdateSensorInput, DeleteSensorInput,
  createSensorHandler, updateSensorHandler, deleteSensorHandler,
} from './tools/sensor-crud.js';
import {
  PerformActionInput, CreateScheduledActionInput, ListActionsInput, ListScheduledActionsInput,
  GetActionStatusInput, StopActionInput, ApproveActionInput, DeleteScheduledActionInput,
  ListActionGroupsInput, CreateActionGroupInput,
  performAction, createScheduledAction, listActions, listScheduledActions,
  getActionStatus, stopAction, approveAction, deleteScheduledAction,
  listActionGroups, createActionGroup,
} from './tools/actions.js';
import {
  ListComputerGroupsInput, GetComputerGroupInput, CreateComputerGroupInput, DeleteComputerGroupInput,
  listComputerGroups, getComputerGroup, createComputerGroup, deleteComputerGroup,
} from './tools/computer-groups.js';
import {
  ListPatchDeploymentsInput, CreatePatchDeploymentInput, StopPatchDeploymentInput, GetPatchDeploymentInput,
  UpsertPatchListInput, ListPatchDefinitionsInput, CreatePatchScanConfigInput,
  CreateMaintenanceWindowPatchInput, ManagePatchBlocklistInput,
  listPatchDeployments, createPatchDeployment, stopPatchDeployment, getPatchDeploymentDetails,
  listPatchLists, upsertPatchList, listPatchDefinitions, listPatchScanConfigurations,
  createPatchScanConfig, listMaintenanceWindowsPatch, createMaintenanceWindowPatch,
  listPatchBlocklists, managePatchBlocklist, listPatchRepos,
} from './tools/patch.js';
import {
  ListSoftwarePackagesInput, GetSoftwareDeploymentInput, ManageSoftwareInput,
  ListDeployDeploymentsInput, CreateDeployDeploymentInput, CreateMaintenanceWindowDeployInput,
  UploadTempFileInput,
  listSoftwarePackages, getSoftwareDeployment, manageSoftware,
  listDeployDeployments, createDeployDeploymentHandler, listMaintenanceWindowsDeploy,
  createMaintenanceWindowDeploy, listDeployProfiles, uploadTempFileHandler, listSoftwareBundles,
} from './tools/deploy.js';
import {
  QueryComplianceResultsInput, ListCVEsInput, ListComplianceExceptionsInput,
  CreateComplianceExceptionInput,
  queryComplianceResults, listCVEs, listComplianceExceptions, createComplianceExceptionHandler,
  listBenchmarks, listCustomChecks, listComplyBundles, listVulnerabilitySources,
} from './tools/comply.js';
import {
  ListAssetProductsInput, ListAssetProductEndpointsInput, ListAssetsInput, GetAssetInput,
  CreateAssetViewInput,
  listAssetProducts, listAssetProductEndpoints, listAssets, getAssetHandler,
  listAssetAttributes, listAssetViews, createAssetViewHandler,
} from './tools/asset.js';
import {
  CreateConnectionInput, RunConnectionInput, StopConnectionRunInput, ListConnectionRunsInput,
  GetConnectionLogsInput, ListConnectDestinationsInput, CreateConnectDestinationInput,
  ListConnectSourcesInput, ExportConnectionInput,
  listConnections, createConnectionHandler, runConnectionHandler, stopConnectionRunHandler,
  listConnectionRuns, getConnectionLogsHandler, listConnectDestinations, createConnectDestinationHandler,
  listConnectSources, importConnectionHandler, exportConnectionHandler,
} from './tools/connect.js';
import {
  ListReportsInput, GetReportDataInput, ExportReportInput, ImportReportInput, DeleteReportInput,
  listReports, getReportData, exportReport, importReport, deleteReport,
} from './tools/reports.js';
import {
  ListPlaybooksInput, StartPlaybookInput, ListPlaybookRunsInput, GetPlaybookRunInput,
  UpsertPlaybookInput, UpsertPlaybookScheduleInput,
  listPlaybooks, startPlaybook, listPlaybookRuns, getPlaybookRun, upsertPlaybook, upsertPlaybookSchedule,
} from './tools/playbooks.js';
import {
  ListSavedQuestionsInput, GetSavedQuestionResultsInput,
  listSavedQuestions, getSavedQuestionResultsHandler,
} from './tools/saved-questions.js';
import {
  GrantAPITokenInput, RevokeAPITokenInput, RotateAPITokenInput,
  listAPITokens, grantAPIToken, revokeAPIToken, rotateAPIToken,
} from './tools/tokens.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'tanium-mcp',
    version: '0.1.0',
  });

  // ── Domain 1: Endpoint Querying ────────────────────────────────────────────
  server.tool(
    'query_endpoints',
    'Query Tanium endpoints with filtering, sorting, and pagination. Returns endpoint details including computer name, IP, OS, and status.',
    QueryEndpointsInput.shape,
    async (input) => toolResult(await queryEndpoints(input))
  );

  server.tool(
    'query_sensor_data',
    'Query live sensor data from endpoints. Use search_sensors first to find the exact sensor name. Returns a question ID for async polling.',
    QuerySensorDataInput.shape,
    async (input) => toolResult(await querySensorData(input))
  );

  server.tool(
    'get_question_results',
    'Get results for a previously submitted sensor data question. Call after query_sensor_data returns a question_id.',
    GetQuestionResultsInput.shape,
    async (input) => toolResult(await getQuestionResults(input))
  );

  // ── Domain 2: Sensor Discovery ─────────────────────────────────────────────
  server.tool(
    'search_sensors',
    'Search the sensor catalog by keyword. Always call this before query_sensor_data to find the exact sensor name. Returns top 20 matches.',
    SearchSensorsInput.shape,
    async (input) => toolResult(await searchSensorsHandler(input))
  );

  server.tool(
    'get_sensor',
    'Get full details of a specific sensor by name, including all parameters and column definitions.',
    GetSensorInput.shape,
    async (input) => toolResult(await getSensor(input))
  );

  server.tool(
    'harvest_sensor',
    'Register or unregister a sensor for data harvesting.',
    HarvestSensorInput.shape,
    async (input) => toolResult(await harvestSensor(input))
  );

  // ── Domain 3: Package Management ───────────────────────────────────────────
  server.tool(
    'search_packages',
    'Search the package catalog by keyword. Always call this before perform_action to find the exact package name. Returns top 20 matches.',
    SearchPackagesInput.shape,
    async (input) => toolResult(await searchPackagesHandler(input))
  );

  server.tool(
    'get_package',
    'Get full details of a specific package by name.',
    GetPackageInput.shape,
    async (input) => toolResult(await getPackage(input))
  );

  server.tool(
    'create_package',
    'Create a new Tanium package (via Platform REST API).',
    CreatePackageInput.shape,
    async (input) => toolResult(await createPackageHandler(input))
  );

  server.tool(
    'update_package',
    'Update an existing Tanium package by ID.',
    UpdatePackageInput.shape,
    async (input) => toolResult(await updatePackageHandler(input))
  );

  server.tool(
    'delete_package',
    'Delete a Tanium package by ID.',
    DeletePackageInput.shape,
    async (input) => toolResult(await deletePackageHandler(input))
  );

  // ── Domain 4: Sensor CRUD ─────────────────────────────────────────────────
  server.tool(
    'create_sensor',
    'Create a new Tanium sensor (via Platform REST API).',
    CreateSensorInput.shape,
    async (input) => toolResult(await createSensorHandler(input))
  );

  server.tool(
    'update_sensor',
    'Update an existing sensor by ID.',
    UpdateSensorInput.shape,
    async (input) => toolResult(await updateSensorHandler(input))
  );

  server.tool(
    'delete_sensor',
    'Delete a sensor by ID.',
    DeleteSensorInput.shape,
    async (input) => toolResult(await deleteSensorHandler(input))
  );

  // ── Domain 5: Actions ─────────────────────────────────────────────────────
  server.tool(
    'perform_action',
    'Deploy a package to target endpoints. Use search_packages first to find the exact package name. Returns action ID. Set wait_for_results=true to block until completion.',
    PerformActionInput.shape,
    async (input) => toolResult(await performAction(input))
  );

  server.tool(
    'create_scheduled_action',
    'Create a recurring scheduled action. Returns approval_required if action requires approval.',
    CreateScheduledActionInput.shape,
    async (input) => toolResult(await createScheduledAction(input))
  );

  server.tool(
    'list_actions',
    '[EXPERIMENTAL RC] List recent actions with optional filtering. Note: actions query is Stability 1.2 and may change.',
    ListActionsInput.shape,
    async (input) => toolResult(await listActions(input))
  );

  server.tool(
    'list_scheduled_actions',
    'List scheduled actions with optional filtering and pagination.',
    ListScheduledActionsInput.shape,
    async (input) => toolResult(await listScheduledActions(input))
  );

  server.tool(
    'get_action_status',
    'Get the current status and results of an action. Returns completed, running, waiting, failed counts.',
    GetActionStatusInput.shape,
    async (input) => toolResult(await getActionStatus(input))
  );

  server.tool(
    'stop_action',
    'Stop an action that is currently in progress.',
    StopActionInput.shape,
    async (input) => toolResult(await stopAction(input))
  );

  server.tool(
    'approve_action',
    'Approve a scheduled action that requires approval (status=DISABLED).',
    ApproveActionInput.shape,
    async (input) => toolResult(await approveAction(input))
  );

  server.tool(
    'delete_scheduled_action',
    'Delete a scheduled action by ID.',
    DeleteScheduledActionInput.shape,
    async (input) => toolResult(await deleteScheduledAction(input))
  );

  server.tool(
    'list_action_groups',
    'List all action groups (endpoint targeting groups for actions).',
    ListActionGroupsInput.shape,
    async (input) => toolResult(await listActionGroups(input))
  );

  server.tool(
    'create_action_group',
    'Create a new action group targeting specific computer groups.',
    CreateActionGroupInput.shape,
    async (input) => toolResult(await createActionGroup(input))
  );

  // ── Domain 6: Computer Groups ─────────────────────────────────────────────
  server.tool(
    'list_computer_groups',
    'List all computer groups (endpoint collections for targeting).',
    ListComputerGroupsInput.shape,
    async (input) => toolResult(await listComputerGroups(input))
  );

  server.tool(
    'get_computer_group',
    'Get a specific computer group by name or ID.',
    GetComputerGroupInput.shape,
    async (input) => toolResult(await getComputerGroup(input))
  );

  server.tool(
    'create_computer_group',
    'Create a new computer group with an optional filter expression.',
    CreateComputerGroupInput.shape,
    async (input) => toolResult(await createComputerGroup(input))
  );

  server.tool(
    'delete_computer_group',
    'Delete a computer group by name or ID.',
    DeleteComputerGroupInput.shape,
    async (input) => toolResult(await deleteComputerGroup(input))
  );

  // ── Domain 7: Patch Management ────────────────────────────────────────────
  server.tool(
    'list_patch_deployments',
    'List patch deployments (via Patch REST API).',
    ListPatchDeploymentsInput.shape,
    async (input) => toolResult(await listPatchDeployments(input))
  );

  server.tool(
    'create_patch_deployment',
    'Create a new patch deployment (via GraphQL Stability 3).',
    CreatePatchDeploymentInput.shape,
    async (input) => toolResult(await createPatchDeployment(input))
  );

  server.tool(
    'stop_patch_deployment',
    'Stop a running patch deployment.',
    StopPatchDeploymentInput.shape,
    async (input) => toolResult(await stopPatchDeployment(input))
  );

  server.tool(
    'get_patch_deployment',
    'Get details of a specific patch deployment.',
    GetPatchDeploymentInput.shape,
    async (input) => toolResult(await getPatchDeploymentDetails(input))
  );

  server.tool(
    'list_patch_lists',
    'List available patch lists.',
    {},
    async () => toolResult(await listPatchLists())
  );

  server.tool(
    'upsert_patch_list',
    'Create or update a patch list.',
    UpsertPatchListInput.shape,
    async (input) => toolResult(await upsertPatchList(input))
  );

  server.tool(
    'list_patch_definitions',
    '[EXPERIMENTAL EARLY] List patch definitions. Warning: Stability 1.0 — subject to breaking changes.',
    ListPatchDefinitionsInput.shape,
    async (input) => toolResult(await listPatchDefinitions(input))
  );

  server.tool(
    'list_patch_scan_configurations',
    'List patch scan configurations.',
    {},
    async () => toolResult(await listPatchScanConfigurations())
  );

  server.tool(
    'create_patch_scan_configuration',
    'Create a new patch scan configuration.',
    CreatePatchScanConfigInput.shape,
    async (input) => toolResult(await createPatchScanConfig(input))
  );

  server.tool(
    'list_maintenance_windows_patch',
    'List patch maintenance windows.',
    {},
    async () => toolResult(await listMaintenanceWindowsPatch())
  );

  server.tool(
    'create_maintenance_window_patch',
    'Create a new patch maintenance window.',
    CreateMaintenanceWindowPatchInput.shape,
    async (input) => toolResult(await createMaintenanceWindowPatch(input))
  );

  server.tool(
    'list_patch_blocklists',
    'List patch blocklists (patches excluded from deployment).',
    {},
    async () => toolResult(await listPatchBlocklists())
  );

  server.tool(
    'manage_patch_blocklist',
    'Create, update, or delete a patch blocklist entry.',
    ManagePatchBlocklistInput.shape,
    async (input) => toolResult(await managePatchBlocklist(input))
  );

  server.tool(
    'list_patch_repos',
    'List configured patch repositories.',
    {},
    async () => toolResult(await listPatchRepos())
  );

  // ── Domain 8: Software Deployment ────────────────────────────────────────
  server.tool(
    'list_software_packages',
    'List software packages available for deployment.',
    ListSoftwarePackagesInput.shape,
    async (input) => toolResult(await listSoftwarePackages(input))
  );

  server.tool(
    'get_software_deployment',
    'Get details of a software deployment.',
    GetSoftwareDeploymentInput.shape,
    async (input) => toolResult(await getSoftwareDeployment(input))
  );

  server.tool(
    'manage_software',
    'Install, update, or remove software on endpoints. Set wait_for_results=true to poll until completion.',
    ManageSoftwareInput.shape,
    async (input) => toolResult(await manageSoftware(input))
  );

  server.tool(
    'list_deployments_deploy',
    'List software deployments via Deploy REST API.',
    ListDeployDeploymentsInput.shape,
    async (input) => toolResult(await listDeployDeployments(input))
  );

  server.tool(
    'create_deployment_deploy',
    'Create a software deployment via Deploy REST API.',
    CreateDeployDeploymentInput.shape,
    async (input) => toolResult(await createDeployDeploymentHandler(input))
  );

  server.tool(
    'list_maintenance_windows_deploy',
    'List deploy maintenance windows.',
    {},
    async () => toolResult(await listMaintenanceWindowsDeploy())
  );

  server.tool(
    'create_maintenance_window_deploy',
    'Create a deploy maintenance window.',
    CreateMaintenanceWindowDeployInput.shape,
    async (input) => toolResult(await createMaintenanceWindowDeploy(input))
  );

  server.tool(
    'list_deploy_profiles',
    'List deployment profiles.',
    {},
    async () => toolResult(await listDeployProfiles())
  );

  server.tool(
    'upload_temp_file',
    'Upload a temporary file for use in package creation.',
    UploadTempFileInput.shape,
    async (input) => toolResult(await uploadTempFileHandler(input))
  );

  server.tool(
    'list_software_bundles',
    'List software package bundles.',
    {},
    async () => toolResult(await listSoftwareBundles())
  );

  // ── Domain 9: Compliance ─────────────────────────────────────────────────
  server.tool(
    'query_compliance_results',
    'Query compliance results by sensor/rule hash via Comply REST API.',
    QueryComplianceResultsInput.shape,
    async (input) => toolResult(await queryComplianceResults(input))
  );

  server.tool(
    'list_cves',
    'List CVEs with optional severity and platform filtering.',
    ListCVEsInput.shape,
    async (input) => toolResult(await listCVEs(input))
  );

  server.tool(
    'list_compliance_exceptions',
    'List compliance exceptions.',
    ListComplianceExceptionsInput.shape,
    async (input) => toolResult(await listComplianceExceptions(input))
  );

  server.tool(
    'create_compliance_exception',
    'Create a compliance exception for a rule or endpoint.',
    CreateComplianceExceptionInput.shape,
    async (input) => toolResult(await createComplianceExceptionHandler(input))
  );

  server.tool(
    'list_benchmarks',
    'List compliance benchmarks (CIS, DISA STIG, etc.).',
    {},
    async () => toolResult(await listBenchmarks())
  );

  server.tool(
    'list_custom_checks',
    'List custom compliance checks.',
    {},
    async () => toolResult(await listCustomChecks())
  );

  server.tool(
    'list_comply_bundles',
    'List compliance content bundles.',
    {},
    async () => toolResult(await listComplyBundles())
  );

  server.tool(
    'list_vulnerability_sources',
    'List vulnerability data sources.',
    {},
    async () => toolResult(await listVulnerabilitySources())
  );

  // ── Domain 10: Asset Inventory ────────────────────────────────────────────
  server.tool(
    'list_asset_products',
    'List software products tracked by Asset solution (GraphQL Stability 3).',
    ListAssetProductsInput.shape,
    async (input) => toolResult(await listAssetProducts(input))
  );

  server.tool(
    'list_asset_product_endpoints',
    'List endpoints associated with an asset product.',
    ListAssetProductEndpointsInput.shape,
    async (input) => toolResult(await listAssetProductEndpoints(input))
  );

  server.tool(
    'list_assets',
    'List assets from Asset REST API (GQL assets is deprecated). Supports cursor-based pagination.',
    ListAssetsInput.shape,
    async (input) => toolResult(await listAssets(input))
  );

  server.tool(
    'get_asset',
    'Get a specific asset by ID.',
    GetAssetInput.shape,
    async (input) => toolResult(await getAssetHandler(input))
  );

  server.tool(
    'list_asset_attributes',
    'List available asset attributes.',
    {},
    async () => toolResult(await listAssetAttributes())
  );

  server.tool(
    'list_asset_views',
    'List asset views.',
    {},
    async () => toolResult(await listAssetViews())
  );

  server.tool(
    'create_asset_view',
    'Create a new asset view.',
    CreateAssetViewInput.shape,
    async (input) => toolResult(await createAssetViewHandler(input))
  );

  // ── Domain 11: Connect (Data Pipelines) ───────────────────────────────────
  server.tool(
    'list_connections',
    'List Connect data pipeline connections (via Connect REST API).',
    {},
    async () => toolResult(await listConnections())
  );

  server.tool(
    'create_connection',
    'Create a new Connect data pipeline connection.',
    CreateConnectionInput.shape,
    async (input) => toolResult(await createConnectionHandler(input))
  );

  server.tool(
    'run_connection',
    'Trigger a Connect connection to run immediately.',
    RunConnectionInput.shape,
    async (input) => toolResult(await runConnectionHandler(input))
  );

  server.tool(
    'stop_connection_run',
    'Stop a running Connect connection.',
    StopConnectionRunInput.shape,
    async (input) => toolResult(await stopConnectionRunHandler(input))
  );

  server.tool(
    'list_connection_runs',
    'List run history for a Connect connection.',
    ListConnectionRunsInput.shape,
    async (input) => toolResult(await listConnectionRuns(input))
  );

  server.tool(
    'get_connection_logs',
    'Get logs for a specific Connect connection run.',
    GetConnectionLogsInput.shape,
    async (input) => toolResult(await getConnectionLogsHandler(input))
  );

  server.tool(
    'list_connect_destinations',
    'List Connect destinations by type (sqlservers, databases, elasticsearches, smtps, files, https, sockets).',
    ListConnectDestinationsInput.shape,
    async (input) => toolResult(await listConnectDestinations(input))
  );

  server.tool(
    'create_connect_destination',
    'Create a new Connect destination.',
    CreateConnectDestinationInput.shape,
    async (input) => toolResult(await createConnectDestinationHandler(input))
  );

  server.tool(
    'list_connect_sources',
    'List Connect sources by type (actionlogs, events, questionlogs, savedquestions, serverinformations, systemstatuses).',
    ListConnectSourcesInput.shape,
    async (input) => toolResult(await listConnectSources(input))
  );

  server.tool(
    'import_connection',
    'Import a Connect connection from exported definition.',
    z.object({ connection_data: z.record(z.unknown()) }).shape,
    async (input) => toolResult(await importConnectionHandler(input.connection_data))
  );

  server.tool(
    'export_connection',
    'Export a Connect connection definition.',
    ExportConnectionInput.shape,
    async (input) => toolResult(await exportConnectionHandler(input))
  );

  // ── Domain 12: Reports ────────────────────────────────────────────────────
  server.tool(
    'list_reports',
    'List available reports.',
    ListReportsInput.shape,
    async (input) => toolResult(await listReports(input))
  );

  server.tool(
    'get_report_data',
    'Get paginated data from a report. Use nextCursor for subsequent pages.',
    GetReportDataInput.shape,
    async (input) => toolResult(await getReportData(input))
  );

  server.tool(
    'export_report',
    'Export a report definition.',
    ExportReportInput.shape,
    async (input) => toolResult(await exportReport(input))
  );

  server.tool(
    'import_report',
    'Import a report from an exported definition.',
    ImportReportInput.shape,
    async (input) => toolResult(await importReport(input))
  );

  server.tool(
    'delete_report',
    '[EXPERIMENTAL RC] Delete a report. Note: reportDelete is Stability 1.2.',
    DeleteReportInput.shape,
    async (input) => toolResult(await deleteReport(input))
  );

  // ── Domain 13: Playbooks (Automate) ───────────────────────────────────────
  server.tool(
    'list_playbooks',
    'List Automate playbooks.',
    ListPlaybooksInput.shape,
    async (input) => toolResult(await listPlaybooks(input))
  );

  server.tool(
    'start_playbook',
    'Start a playbook run by ID or name.',
    StartPlaybookInput.shape,
    async (input) => toolResult(await startPlaybook(input))
  );

  server.tool(
    'list_playbook_runs',
    'List playbook run history.',
    ListPlaybookRunsInput.shape,
    async (input) => toolResult(await listPlaybookRuns(input))
  );

  server.tool(
    'get_playbook_run',
    'Get details of a specific playbook run.',
    GetPlaybookRunInput.shape,
    async (input) => toolResult(await getPlaybookRun(input))
  );

  server.tool(
    'upsert_playbook',
    'Create or update a playbook definition.',
    UpsertPlaybookInput.shape,
    async (input) => toolResult(await upsertPlaybook(input))
  );

  server.tool(
    'upsert_playbook_schedule',
    'Create or update a playbook schedule.',
    UpsertPlaybookScheduleInput.shape,
    async (input) => toolResult(await upsertPlaybookSchedule(input))
  );

  // ── Domain 14: Saved Questions ────────────────────────────────────────────
  server.tool(
    'list_saved_questions',
    'List saved questions via Platform REST API.',
    ListSavedQuestionsInput.shape,
    async (input) => toolResult(await listSavedQuestions(input))
  );

  server.tool(
    'get_saved_question_results',
    'Get results for a saved question by ID.',
    GetSavedQuestionResultsInput.shape,
    async (input) => toolResult(await getSavedQuestionResultsHandler(input))
  );

  // ── Domain 15: Token Management ───────────────────────────────────────────
  server.tool(
    'list_api_tokens',
    "List the current user's API tokens.",
    {},
    async () => toolResult(await listAPITokens())
  );

  server.tool(
    'grant_api_token',
    'Create a new API token for the current user.',
    GrantAPITokenInput.shape,
    async (input) => toolResult(await grantAPIToken(input))
  );

  server.tool(
    'rotate_api_token',
    'Rotate an API token by its token string. Note: this server rotates its own token automatically.',
    RotateAPITokenInput.shape,
    async (input) => toolResult(await rotateAPIToken(input))
  );

  server.tool(
    'revoke_api_token',
    'Revoke an API token by ID.',
    RevokeAPITokenInput.shape,
    async (input) => toolResult(await revokeAPIToken(input))
  );

  return server;
}

function toolResult(output: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
  };
}
