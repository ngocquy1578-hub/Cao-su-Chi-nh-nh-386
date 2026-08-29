import {
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const internalAccounts = mysqlTable(
  "internal_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    username: varchar("username", { length: 64 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    displayName: varchar("displayName", { length: 160 }).notNull(),
    groupType: mysqlEnum("groupType", ["board", "functional", "production"]).notNull(),
    roleCode: varchar("roleCode", { length: 64 }).notNull(),
    scopeUnits: text("scopeUnits").notNull(),
    permissionProfile: text("permissionProfile").notNull(),
    isActive: int("isActive").default(1).notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ groupIndex: index("internal_accounts_group_index").on(table.groupType, table.roleCode) }),
);

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    username: varchar("username", { length: 80 }),
    displayName: varchar("displayName", { length: 160 }),
    eventType: varchar("eventType", { length: 64 }).notNull(),
    entityType: varchar("entityType", { length: 64 }).notNull(),
    entityId: varchar("entityId", { length: 96 }),
    summary: text("summary").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userCreatedIndex: index("activity_logs_user_created_index").on(table.userId, table.createdAt),
    eventCreatedIndex: index("activity_logs_event_created_index").on(table.eventType, table.createdAt),
  }),
);

export const plantationPlots = mysqlTable(
  "plantation_plots",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 48 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    unit: varchar("unit", { length: 120 }).notNull(),
    gardenType: mysqlEnum("gardenType", ["A", "B", "C"]),
    areaHa: decimal("areaHa", { precision: 12, scale: 3 }).notNull(),
    rowStart: int("rowStart"),
    rowEnd: int("rowEnd"),
    note: text("note"),
    mapFileKey: varchar("mapFileKey", { length: 512 }),
    mapUrl: varchar("mapUrl", { length: 1024 }),
    mapUpdatedAt: timestamp("mapUpdatedAt"),
    plantedYear: int("plantedYear"),
    cultivar: varchar("cultivar", { length: 160 }),
    inventoryPits: int("inventoryPits"),
    inventoryTrees: int("inventoryTrees"),
    tappingTrees: int("tappingTrees"),
    immatureTrees: int("immatureTrees"),
    nonproductiveTrees: int("nonproductiveTrees"),
    diseasedTrees: int("diseasedTrees"),
    dryTappingTrees: int("dryTappingTrees"),
    emptyPits: int("emptyPits"),
    tappingDensity: decimal("tappingDensity", { precision: 12, scale: 2 }),
    indicatorDate: timestamp("indicatorDate"),
    tappingDay: int("tappingDay"),
    plotRank: varchar("plotRank", { length: 12 }),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    codeUnique: uniqueIndex("plantation_plots_code_unique").on(table.code),
    unitIndex: index("plantation_plots_unit_index").on(table.unit),
  }),
);

export const latexImports = mysqlTable(
  "latex_imports",
  {
    id: int("id").autoincrement().primaryKey(),
    plotId: int("plotId").notNull(),
    recordDate: timestamp("recordDate").notNull(),
    periodLabel: varchar("periodLabel", { length: 80 }).notNull(),
    frozenLatex: decimal("frozenLatex", { precision: 14, scale: 2 }).notNull(),
    latexThread: decimal("latexThread", { precision: 14, scale: 2 }).notNull(),
    note: text("note"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    plotDateUnique: uniqueIndex("latex_imports_plot_date_unique").on(table.plotId, table.recordDate),
    dateIndex: index("latex_imports_date_index").on(table.recordDate),
    periodIndex: index("latex_imports_period_index").on(table.periodLabel),
  }),
);

export const latexExports = mysqlTable(
  "latex_exports",
  {
    id: int("id").autoincrement().primaryKey(),
    plotId: int("plotId").notNull(),
    periodLabel: varchar("periodLabel", { length: 80 }).notNull(),
    recordDate: timestamp("recordDate").notNull(),
    frozenContaminatedLatex: decimal("frozenContaminatedLatex", { precision: 14, scale: 2 }).notNull(),
    latexThread: decimal("latexThread", { precision: 14, scale: 2 }).notNull(),
    note: text("note"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    plotDateIndex: index("latex_exports_plot_date_index").on(table.plotId, table.recordDate),
    periodIndex: index("latex_exports_period_index").on(table.periodLabel),
  }),
);

export const careActivities = mysqlTable(
  "care_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    plotId: int("plotId").notNull(),
    activityDate: timestamp("activityDate").notNull(),
    description: text("description").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    plotDateIndex: index("care_activities_plot_date_index").on(table.plotId, table.activityDate),
  }),
);

export const dailyCareRecords = mysqlTable(
  "daily_care_records",
  {
    id: int("id").autoincrement().primaryKey(),
    category: mysqlEnum("category", ["tapping", "reinforcement", "care", "treatment"]).notNull(),
    activityDate: timestamp("activityDate").notNull(),
    unit: varchar("unit", { length: 120 }).notNull(),
    gardenName: varchar("gardenName", { length: 160 }),
    plotId: int("plotId"),
    areaHa: decimal("areaHa", { precision: 12, scale: 2 }),
    tappingSection: int("tappingSection"),
    planQuantity: decimal("planQuantity", { precision: 14, scale: 2 }).notNull(),
    actualQuantity: decimal("actualQuantity", { precision: 14, scale: 2 }).notNull(),
    cumulativeQuantity: decimal("cumulativeQuantity", { precision: 14, scale: 2 }).notNull(),
    metricUnit: varchar("metricUnit", { length: 24 }).notNull(),
    completedGardens: int("completedGardens"),
    pendingGardens: int("pendingGardens"),
    partialGardens: int("partialGardens"),
    progressPercent: decimal("progressPercent", { precision: 8, scale: 2 }),
    nextGarden: varchar("nextGarden", { length: 160 }),
    workContent: varchar("workContent", { length: 220 }),
    note: text("note"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    categoryDateIndex: index("daily_care_category_date_index").on(table.category, table.activityDate),
    unitDateIndex: index("daily_care_unit_date_index").on(table.unit, table.activityDate),
    uniqueDailyEntry: uniqueIndex("daily_care_unique_entry").on(table.category, table.unit, table.gardenName, table.activityDate),
  }),
);

export const workers = mysqlTable(
  "workers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    employeeCode: varchar("employeeCode", { length: 64 }),
    unit: varchar("unit", { length: 120 }),
    phoneticName: varchar("phoneticName", { length: 160 }),
    gender: mysqlEnum("gender", ["male", "female"]).default("male").notNull(),
    phone: varchar("phone", { length: 32 }),
    roleTitle: varchar("roleTitle", { length: 120 }).notNull(),
    status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
    note: text("note"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    statusIndex: index("workers_status_index").on(table.status),
    unitNameUnique: uniqueIndex("workers_unit_name_unique").on(table.unit, table.name),
    employeeCodeUnique: uniqueIndex("workers_employee_code_unique").on(table.employeeCode),
  }),
);

export const workforceTeamTargets = mysqlTable(
  "workforce_team_targets",
  {
    id: int("id").autoincrement().primaryKey(),
    unit: varchar("unit", { length: 120 }).notNull(),
    staffingTarget: int("staffingTarget").notNull(),
    updatedBy: int("updatedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ unitUnique: uniqueIndex("workforce_team_targets_unit_unique").on(table.unit) }),
);

export const workforceMonthlySnapshots = mysqlTable(
  "workforce_monthly_snapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    monthKey: varchar("monthKey", { length: 7 }).notNull(),
    activeCount: int("activeCount").notNull(),
    totalCount: int("totalCount").notNull(),
    updatedBy: int("updatedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ monthUnique: uniqueIndex("workforce_monthly_snapshots_month_unique").on(table.monthKey) }),
);

export const workforceTeamMonthlySnapshots = mysqlTable(
  "workforce_team_monthly_snapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    monthKey: varchar("monthKey", { length: 7 }).notNull(),
    unit: varchar("unit", { length: 120 }).notNull(),
    activeCount: int("activeCount").notNull(),
    totalCount: int("totalCount").notNull(),
    updatedBy: int("updatedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    monthUnitUnique: uniqueIndex("workforce_team_monthly_snapshots_month_unit_unique").on(table.monthKey, table.unit),
    unitMonthIndex: index("workforce_team_monthly_snapshots_unit_month_index").on(table.unit, table.monthKey),
  }),
);

export const workforceSnapshotSchedule = mysqlTable(
  "workforce_snapshot_schedule",
  {
    id: int("id").primaryKey(),
    taskUid: varchar("taskUid", { length: 65 }).notNull().unique(),
    updatedBy: int("updatedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ taskUidIndex: index("workforce_snapshot_schedule_task_uid_index").on(table.taskUid) }),
);

export const dataBackups = mysqlTable(
  "data_backups",
  {
    id: int("id").autoincrement().primaryKey(),
    backupKey: varchar("backupKey", { length: 64 }).notNull().unique(),
    source: mysqlEnum("source", ["automatic", "manual"]).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    recordCount: int("recordCount").notNull(),
    summary: text("summary").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ createdAtIndex: index("data_backups_created_at_index").on(table.createdAt) }),
);

export const dataBackupSchedule = mysqlTable(
  "data_backup_schedule",
  {
    id: int("id").primaryKey(),
    taskUid: varchar("taskUid", { length: 65 }).notNull().unique(),
    updatedBy: int("updatedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ taskUidIndex: index("data_backup_schedule_task_uid_index").on(table.taskUid) }),
);

export const userDashboardPreferences = mysqlTable(
  "user_dashboard_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    teamOverviewColumns: text("teamOverviewColumns").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ userUnique: uniqueIndex("user_dashboard_preferences_user_unique").on(table.userId) }),
);

export const managementGroupTargets = mysqlTable(
  "management_group_targets",
  {
    id: int("id").autoincrement().primaryKey(),
    groupType: mysqlEnum("groupType", ["board", "functional", "production"]).notNull(),
    staffingTarget: int("staffingTarget").notNull(),
    updatedBy: int("updatedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ groupUnique: uniqueIndex("management_group_targets_group_unique").on(table.groupType) }),
);

export const teamLatexImports = mysqlTable(
  "team_latex_imports",
  {
    id: int("id").autoincrement().primaryKey(),
    unit: varchar("unit", { length: 120 }).notNull(),
    gardenName: varchar("gardenName", { length: 160 }).notNull(),
    periodLabel: varchar("periodLabel", { length: 80 }).notNull(),
    recordDate: timestamp("recordDate").notNull(),
    frozenLatex: decimal("frozenLatex", { precision: 14, scale: 2 }).notNull(),
    latexThread: decimal("latexThread", { precision: 14, scale: 2 }).notNull(),
    source: varchar("source", { length: 100 }).default("Excel import").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    teamDateUnique: uniqueIndex("team_latex_imports_unique").on(table.unit, table.gardenName, table.recordDate),
    periodIndex: index("team_latex_imports_period_index").on(table.periodLabel),
  }),
);

export const teamLatexExports = mysqlTable(
  "team_latex_exports",
  {
    id: int("id").autoincrement().primaryKey(),
    unit: varchar("unit", { length: 120 }).notNull(),
    periodLabel: varchar("periodLabel", { length: 80 }).notNull(),
    recordDate: timestamp("recordDate").notNull(),
    frozenContaminatedLatex: decimal("frozenContaminatedLatex", { precision: 14, scale: 2 }).notNull(),
    latexThread: decimal("latexThread", { precision: 14, scale: 2 }).notNull(),
    note: text("note"),
    source: varchar("source", { length: 100 }).default("Excel import").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    teamDateUnique: uniqueIndex("team_latex_exports_unique").on(table.unit, table.recordDate),
    periodIndex: index("team_latex_exports_period_index").on(table.periodLabel),
  }),
);

export const plotLatexProductions = mysqlTable(
  "plot_latex_productions",
  {
    id: int("id").autoincrement().primaryKey(),
    plotId: int("plotId").notNull(),
    recordDate: timestamp("recordDate").notNull(),
    frozenContaminatedLatex: decimal("frozenContaminatedLatex", { precision: 14, scale: 2 }).notNull(),
    dryRubber: decimal("dryRubber", { precision: 14, scale: 2 }).notNull(),
    source: varchar("source", { length: 100 }).default("Nhập tay").notNull(),
    note: text("note"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    plotDateUnique: uniqueIndex("plot_latex_productions_plot_date_unique").on(table.plotId, table.recordDate),
    dateIndex: index("plot_latex_productions_date_index").on(table.recordDate),
  }),
);

export const plotProductionPeriodLocks = mysqlTable(
  "plot_production_period_locks",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    month: int("month").notNull(),
    lockedBy: int("lockedBy").notNull(),
    lockedAt: timestamp("lockedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ periodUnique: uniqueIndex("plot_production_period_locks_year_month_unique").on(table.year, table.month) }),
);

export const workforceAssignments = mysqlTable(
  "workforce_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    workerId: int("workerId").notNull(),
    plotId: int("plotId").notNull(),
    task: varchar("task", { length: 220 }).notNull(),
    assignmentDate: timestamp("assignmentDate").notNull(),
    status: mysqlEnum("status", ["planned", "in_progress", "completed"]).default("planned").notNull(),
    note: text("note"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    workerDateIndex: index("workforce_assignments_worker_date_index").on(table.workerId, table.assignmentDate),
    plotDateIndex: index("workforce_assignments_plot_date_index").on(table.plotId, table.assignmentDate),
  }),
);

export const workerPlotAllocations = mysqlTable(
  "worker_plot_allocations",
  {
    id: int("id").autoincrement().primaryKey(),
    workerId: int("workerId").notNull(),
    plotId: int("plotId").notNull(),
    gardenType: mysqlEnum("gardenType", ["A", "B", "C"]).notNull(),
    rowStart: int("rowStart").notNull(),
    rowEnd: int("rowEnd").notNull(),
    areaHa: decimal("areaHa", { precision: 12, scale: 3 }).notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    workerPlotRowsUnique: uniqueIndex("worker_plot_alloc_rows_unique").on(table.workerId, table.plotId, table.rowStart, table.rowEnd),
    workerIndex: index("worker_plot_alloc_worker_index").on(table.workerId),
    plotIndex: index("worker_plot_alloc_plot_index").on(table.plotId),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
