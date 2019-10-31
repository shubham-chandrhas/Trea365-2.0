import { EditModeDirective } from './shared/directives/edit-mode.directive';
import { ViewModeDirective } from './shared/directives/view-mode.directive';
import { TimesheetInlineEditComponent } from './component/hr/timesheet/timesheet-inline-edit/timesheet-inline-edit.component';
import { ScheduleCalendarDisplayComponent } from './component/workflow/schedule/timeline/schedule-calendar-display/schedule-calendar-display.component';

import { UnauthorizedAccessComponent } from './component/error-pages/unauthorized-access/unauthorized-access.component';
import { CanaccesGuardService } from './shared/service/canacces-guard.service';
import { CanAccessDirective } from './shared/directives/can-access.directive';
import { AccessRolesComponent } from "./component/onboarding/access-roles/access-roles.component";
import { AddAccessRoleComponent } from "./component/onboarding/access-roles/add-access-role/add-access-role.component";
import { GetEmpDataResolver, GetServiceTypeResolver, GetSubContractorDataResolver } from "./data.resolver";
import { NgModule } from "@angular/core";
import { Routes, RouterModule, CanActivate } from '@angular/router';
import { AuthService } from "./auth/auth.service";
import { AuthGuardService as AuthGuard } from "./auth/auth-guard.service";
import { RoleGuardService as RoleGuard } from "./auth/role-guard.service";

import { AppComponent } from "./app.component";
import {
  LoginComponent,
  ClientLoginComponent
} from "./auth/login/login.component";
import {
  ForgotCredentialStepOneComponent,
  ForgotCredentialStepTwoComponent,
  ResetCredentialStepTwoComponent,
  ForgotCredentialStepThreeComponent
} from "./auth/forgot-credential/forgot-credential.component";
import {
  SetPasswordStepOneComponent,
  SetPasswordStepTwoComponent
} from "./auth/set-password/set-password.component";
import { CSALandingComponent } from "./component/dashboard/company-super-admin/landing.component";
import { CompanyUsersDashboardComponent } from "./component/dashboard/company-users/dashboard.component";
import { CompanyUsersLandingComponent } from "./component/dashboard/company-users/landing.component";
import {
  AddUserComponent,
  AddUserWithSocialIDComponent
} from "./component/user-registration/user-registration.component";
import { CSAOnboardingComponent } from "./component/onboarding/dashboard/landing.component";


import { E404Component } from "./component/error-pages/e404/e404.component";
import { DialogComponent } from "./shared/model/dialog/dialog.component";

//Onboarding Components
import { CSAOnboardingDashboardComponent } from "./component/onboarding/dashboard/dashboard.component";
import {
  OnboardingGuideDialogComponent
} from "./component/onboarding/onboarding-guide/onboarding-guide.component";
import { AccountDetailsComponent } from "./component/onboarding/account-details/account-details.component";
import { SettingsComponent, SettingsDialog } from "./component/onboarding/settings/settings.component";
import {
  EditAccountComponent,
  EditAccountDialog
} from "./component/onboarding/account-details/edit-account/edit-account.component";
import { CsvPreviewComponent } from "./component/csv/csv-preview/csv-preview.component";

// NEW CRM Components
import { NewClientListComponent } from "./component/crm/client/client-list/client-list.component";
import { NewClientDialog } from "./component/crm/client/client-dialog.component";
import { NewAddClientComponent } from "./component/crm/client/add-client/add-client.component";
import { NewClientReviewComponent } from "./component/crm/client/client-review/client-review.component";

// Accounting Components
import { PayablesComponent } from "./component/accounting/payables/payables.component";
import { ReceivablesComponent } from "./component/accounting/receivables/receivables.component";
import { InvoiceListComponent } from "./component/accounting/invoice/invoice-list/invoice-list.component";
import { NewInvoiceComponent } from "./component/accounting/invoice/new-invoice/new-invoice.component";
import { LedgerListComponent } from "./component/accounting/ledger/ledger-list/ledger-list.component";
import { CreateInvoiceComponent } from "./component/accounting/invoice/create-invoice/create-invoice.component";
import { ReviewInvoiceComponent } from "./component/accounting/invoice/review-invoice/review-invoice.component";
import { AccountingDialog } from "./component/accounting/accounting-dialog.component";
import { InvoiceQuotationReviewComponent } from "./component/accounting/invoice/invoice-quotation-review/invoice-quotation-review.component";
import { CreateInvoiceWithoutQuoComponent } from './component/accounting/invoice/create-invoice-without-quo/create-invoice-without-quo';


//Dashboard(Reports) Components
import { SummaryComponent } from "./component/dashboard/company-super-admin/summary/summary.component";
import { OldSummaryComponent } from "./component/dashboard/company-super-admin/summary-old/summary.component";

//Hr Components
import { EmployeeDialog } from "./component/hr/employee/employee-dialog.component";
import { EmployeeListComponent } from "./component/hr/employee/employee-list/employee-list.component";
import { NewEmployeeComponent } from "./component/hr/employee/new-employee/new-employee.component";
import { EmployeeReviewComponent } from "./component/hr/employee/employee-review/employee-review.component";
import { SubContractorListComponent } from "./component/hr/sub-contractor/sub-contractor-list/sub-contractor-list.component";
import { AddSubContractorComponent } from "./component/hr/sub-contractor/add-sub-contractor/add-sub-contractor.component";
import { SubContractorReviewComponent } from "./component/hr/sub-contractor/sub-contractor-review/sub-contractor-review.component";
import { TimesheetListComponent } from "./component/hr/timesheet/timesheet-list/timesheet-list.component";

//Admin Components
import { PrintLabelComponent } from "./component/admin/print-label/print-label.component";
import { AddLocationComponent } from "./component/admin/location/add-location/add-location.component";
import { LocationReviewComponent } from "./component/admin/location/location-review/location-review.component";
import { LocationListComponent } from "./component/admin/location/location-list/location-list.component";

import { SupplierListComponent } from "./component/admin/supplier/supplier-list/supplier-list.component";
import { AddSupplierComponent } from "./component/admin/supplier/add-supplier/add-supplier.component";
import { SupplierReviewComponent } from "./component/admin/supplier/supplier-review/supplier-review.component";
import {
  ManufacturerComponent,
  ManufacturerDialog
} from "./component/admin/manufacturer/manufacturer/manufacturer.component";
import { ManufacturerPartComponent } from "./component/admin/manufacturer-part/manufacturer-part/manufacturer-part.component";
import { AddManufacturerPartComponent } from "./component/admin/manufacturer-part/manufacturer-part/add-manufacturer-part/add-manufacturer-part.component";
import { MfgAttributesComponent } from "./component/admin/manufacturer-part/manufacturer-part/mfg-attributes/mfg-attributes.component";
import { ManufacturerPartDialog } from "./component/admin/manufacturer-part/manufacturer-part/manufacturer-part.component";
import { ManufacturerPartReviewComponent } from "./component/admin/manufacturer-part/manufacturer-part/manufacturer-part-review/manufacturer-part-review.component";
import { LocationDialog } from "./component/admin/location/location.component";
import { ServiceComponent } from "./component/admin/service/service/service.component";
import { AddServiceComponent } from "./component/admin/service/add-service/add-service.component";
import { ReviewServiceComponent } from "./component/admin/service/review-service/review-service.component";

//Inventory Components
import { AddAssetComponent } from "./component/inventory/assets/add-asset/add-asset.component";
import { AssetListComponent } from "./component/inventory/assets/asset-list/asset-list.component";
import { AssetReviewComponent } from "./component/inventory/assets/asset-review/asset-review.component";
import { AddProductComponent } from "./component/inventory/products/add-product/add-product.component";
import { ProductListComponent } from "./component/inventory/products/product-list/product-list.component";
import { ProductReviewComponent } from "./component/inventory/products/product-review/product-review.component";
import { AddMaterialComponent } from "./component/inventory/material/add-material/add-material.component";
import { MaterialListComponent } from "./component/inventory/material/material-list/material-list.component";
import { MaterialReviewComponent } from "./component/inventory/material/material-review/material-review.component";
import { PurchaseOrderListComponent } from "./component/inventory/purchase-order/purchase-order-list/purchase-order-list.component";
import { NewPurchaseOrderComponent } from "./component/inventory/purchase-order/new-purchase-order/new-purchase-order.component";
import { PurchaseOrderReviewComponent } from "./component/inventory/purchase-order/purchase-order-review/purchase-order-review.component";
import { PurchaseOrderDialog } from "./component/inventory/purchase-order/purchase-order-dialog.component";
import { AuditListComponent } from "./component/inventory/audit/audit-list/audit-list.component";
import { NewAuditComponent } from "./component/inventory/audit/new-audit/new-audit.component";
import { AuditDialog } from "./component/inventory/audit/audit-dialog.component";
import { ReceivingSlipsListComponent } from "./component/inventory/receiving-slip/receiving-slips-list/receiving-slips-list.component";
import { AddReceivingSlipComponent } from "./component/inventory/receiving-slip/add-receiving-slip/add-receiving-slip.component";
import { InventoryDialog } from "./component/inventory/inventory-dialog.component";
import {
  MaintenanceListComponent,
  MaintenanceDialog
} from "./component/inventory/maintenance/maintenance-list/maintenance-list.component";
import { TrackerComponent } from "./component/inventory/tracker/tracker.component";

//Workflow Components
import { QuotationListComponent } from "./component/workflow/project-estimator/quotation-list/quotation-list.component";
import { ClientSelectionComponent } from "./component/workflow/project-estimator/client-selection/client-selection.component";
import { ProjectEstimatorDialog } from "./component/workflow/project-estimator/project-estimator-dialog.component";
import { QuotationGenerationComponent } from "./component/workflow/project-estimator/quotation-generation/quotation-generation.component";
import { QuotationReviewComponent } from "./component/workflow/project-estimator/quotation-review/quotation-review.component";
import { WorkOrderComponent } from "./component/workflow/work-order/work-order/work-order.component";
import { WorkOrderDialog } from "./component/workflow/work-order/work-order-dialog.component";
import { WoSubContractorComponent } from "./component/workflow/work-order/wo-sub-contractor/wo-sub-contractor.component";
import { WoContractorReviewComponent } from "./component/workflow/work-order/wo-contractor-review/wo-contractor-review.component";
import { WorkOrderListComponent } from "./component/workflow/work-order/work-order-list/work-order-list.component";
import { WorkOrderReviewComponent } from "./component/workflow/work-order/work-order-review/work-order-review.component";
import { WoQuotationReviewComponent } from "./component/workflow/work-order/wo-quotation-review/wo-quotation-review.component";
import { AddScheduleComponent } from "./component/workflow/schedule/add-schedule/add-schedule.component";
import { AddTimelineScheduleComponent } from "./component/workflow/schedule/timeline/add-timeline-schedule/add-timeline-schedule.component";
import { TimelineScheduleReviewComponent } from './component/workflow/schedule/timeline//timeline-schedule-review/timeline-schedule-review.component';
import { ScheduleTimelineComponent } from "./component/workflow/schedule/timeline/schedule-timeline/schedule-timeline.component";
import { ScheduleDisplayComponent } from "./component/workflow/schedule/timeline/schedule-display/schedule-display.component";
import { ScheduleListComponent } from "./component/workflow/schedule/schedule-list/schedule-list.component";
import { ScheduleReviewComponent } from "./component/workflow/schedule/schedule-review/schedule-review.component";
import { ServicesComponent } from "./component/workflow/project-estimator/quotation-generation/services/services.component";
import { MaterialsComponent } from "./component/workflow/project-estimator/quotation-generation/materials/materials.component";
import { ScheduleComponent } from "./component/workflow/project-estimator/quotation-generation/schedule/schedule.component";
import { PaymentScheduleComponent } from "./component/workflow/project-estimator/quotation-generation/payment-schedule/payment-schedule.component";
import { ImagesComponent } from "./component/workflow/project-estimator/quotation-generation/images/images.component";
import { WoSetupComponent } from "./component/workflow/work-order/wo-setup/wo-setup.component";
import { ExternalWorkOrderComponent } from "./component/workflow/work-order/external-work-order/external-work-order.component";
import { WOServicesComponent } from "./component/workflow/work-order/external-work-order/services/services.component";
import { TeamComponent } from "./component/workflow/work-order/external-work-order/team/team.component";
import { WOAssetsComponent } from "./component/workflow/work-order/external-work-order/assets/assets.component";
import { ProductsComponent } from "./component/workflow/work-order/external-work-order/products/products.component";
import { ScheduleDialogComponent } from "./component/workflow/schedule/schedule-dialog.component";

//Messaging Component
import { MessagingComponent } from "./component/message/messaging/messaging.component";

//Trea Super Admin Component
import { TSADashboardComponent } from "./component/trea-super-admin/dashboard/dashboard.component";
import { ErrorLogComponent } from "./component/trea-super-admin/error-log/error-log.component";
import { TSALandingComponent } from "./component/trea-super-admin/dashboard/landing.component";
import { CompanyRegistrationComponent } from "./component/trea-super-admin/company-registration/company-registration.component";
import { TSADialogComponent } from "./component/trea-super-admin/tsa.dialog";
import { DispatchAllComponent } from "./component/dispatch/dispatch-dashboard/dispatch-all/dispatch-all.component";
import { DispatchStaffComponent } from "./component/dispatch/dispatch-dashboard/dispatch-staff/dispatch-staff.component";
import { DispatchWoComponent } from "./component/dispatch/dispatch-dashboard/dispatch-wo/dispatch-wo.component";
import { DispatchDashboardComponent } from "./component/dispatch/dispatch-dashboard/dispatch-dashboard.component";
import { DialogMessageComponent } from "./shared/model/dialog/dialog-message.component";
import { EmployeeDetailComponent } from "./component/trea-super-admin/employee-list/employee-detail.component";
import { ReviewInvoiceWithoutQuoComponent } from './component/accounting/invoice/review-invoice-without-quo/review-invoice-without-quo.component';
import { TargetBlankDirective } from './shared/directives/target-blank.directive';

const AppComponentList = [
  TargetBlankDirective,
  AppComponent,
  LoginComponent,
  ClientLoginComponent,
  ForgotCredentialStepOneComponent,
  ForgotCredentialStepTwoComponent,
  ResetCredentialStepTwoComponent,
  ForgotCredentialStepThreeComponent,
  CompanyUsersDashboardComponent,
  CompanyUsersLandingComponent,
  AddUserComponent,
  AddUserWithSocialIDComponent,
  E404Component,
  UnauthorizedAccessComponent,
  SetPasswordStepOneComponent,
  SetPasswordStepTwoComponent,
  DialogComponent,
  DialogMessageComponent,
  CanAccessDirective,
  ViewModeDirective,
  EditModeDirective
];
const OnboardingComponentList = [
  CSAOnboardingDashboardComponent,
  OnboardingGuideDialogComponent,
  AccountDetailsComponent,
  SettingsComponent,
  AccessRolesComponent,
  AddAccessRoleComponent,
  SettingsDialog,
  EditAccountComponent,
  EditAccountDialog,
  CsvPreviewComponent
];
const NewCRMComponentList = [
  NewClientListComponent,
  NewAddClientComponent,
  NewClientReviewComponent,
  NewClientDialog
];
const DispatchComponentList = [
  DispatchAllComponent,
  DispatchStaffComponent,
  DispatchWoComponent,
  DispatchDashboardComponent
];
const AccountingComponentList = [
  PayablesComponent,
  ReceivablesComponent,
  CreateInvoiceComponent,
  InvoiceListComponent,
  NewInvoiceComponent,
  LedgerListComponent,
  ReviewInvoiceComponent,
  AccountingDialog,
  InvoiceQuotationReviewComponent,
  CreateInvoiceWithoutQuoComponent,
  ReviewInvoiceWithoutQuoComponent
];
const DashboardComponentList = [
  SummaryComponent,
  OldSummaryComponent
];
const HRComponentList = [
  SubContractorListComponent,
  AddSubContractorComponent,
  SubContractorReviewComponent,
  TimesheetListComponent,
  TimesheetInlineEditComponent,
  EmployeeDialog
];
const AdminComponentList = [
  LocationDialog,
  PrintLabelComponent,
  AddLocationComponent,
  LocationReviewComponent,
  LocationListComponent,
  ManufacturerComponent,
  ManufacturerDialog,
  ManufacturerPartComponent,
  AddManufacturerPartComponent,
  MfgAttributesComponent,
  ManufacturerPartDialog,
  ManufacturerPartReviewComponent,
  SupplierListComponent,
  AddSupplierComponent,
  SupplierReviewComponent,
  ServiceComponent,
  AddServiceComponent,
  ReviewServiceComponent
];
const InventoryComponentList = [
  MaintenanceListComponent,
  MaintenanceDialog,
  InventoryDialog,
  NewAuditComponent,
  AuditListComponent,
  AuditDialog,
  NewAuditComponent,
  PurchaseOrderListComponent,
  NewPurchaseOrderComponent,
  PurchaseOrderReviewComponent,
  PurchaseOrderDialog,
  ReceivingSlipsListComponent,
  AddReceivingSlipComponent,
  AddAssetComponent,
  AssetListComponent,
  AssetReviewComponent,
  AddMaterialComponent,
  MaterialListComponent,
  MaterialReviewComponent,
  AddProductComponent,
  ProductListComponent,
  ProductReviewComponent,
  ServicesComponent,
  MaterialsComponent,
  ScheduleComponent,
  PaymentScheduleComponent,
  ImagesComponent,
  TrackerComponent
];
const WorkflowComponentList = [
  QuotationListComponent,
  ClientSelectionComponent,
  QuotationGenerationComponent,
  QuotationReviewComponent,
  WorkOrderComponent,
  WorkOrderListComponent,
  WorkOrderReviewComponent,
  AddScheduleComponent,
  ScheduleListComponent,
  ScheduleReviewComponent,
  ProjectEstimatorDialog,
  WorkOrderDialog,
  WoSubContractorComponent,
  WoContractorReviewComponent,
  WoQuotationReviewComponent,
  WoSetupComponent,
  ExternalWorkOrderComponent,
  WOServicesComponent,
  TeamComponent,
  WOAssetsComponent,
  ProductsComponent,
  ScheduleDialogComponent,
  ScheduleTimelineComponent,
  ScheduleDisplayComponent,
  AddTimelineScheduleComponent,
  TimelineScheduleReviewComponent
];
const MessageComponentList = [MessagingComponent];
const TSAComponentList = [
  TSALandingComponent,
  TSADashboardComponent,
  ErrorLogComponent,
  CompanyRegistrationComponent,
  TSADialogComponent
];

export const ComponentList = [
  ...AppComponentList,
  ...NewCRMComponentList,
  ...DispatchComponentList,
  ...OnboardingComponentList,
  ...AccountingComponentList,
  ...DashboardComponentList,
  ...HRComponentList,
  ...AdminComponentList,
  ...InventoryComponentList,
  ...WorkflowComponentList,
  ...MessageComponentList,
  ...TSAComponentList
];

const AppEntryComponentList = [
  DialogComponent,
  TSADialogComponent,
  DialogMessageComponent
];
const OnboardingEntryComponentList = [
  OnboardingGuideDialogComponent,
  EditAccountDialog,
  SettingsDialog
];
// new CRM
const NewCRMEntryComponentList = [NewClientDialog];

const HREntryComponentList = [EmployeeDialog];
const AdminEntryComponentList = [
  LocationDialog,
  ManufacturerDialog,
  ManufacturerPartDialog
];
const InventoryEntryComponentList = [
  MaintenanceDialog,
  InventoryDialog,
  AuditDialog,
  PurchaseOrderDialog
];
const WorkflowEntryComponentList = [
  ProjectEstimatorDialog,
  WorkOrderDialog,
  ScheduleDialogComponent
];
const AccountingEntryComponentList = [AccountingDialog];

export const EntryComponentList = [
  ...AppEntryComponentList,
  ...OnboardingEntryComponentList,
  ...NewCRMEntryComponentList,
  ...HREntryComponentList,
  ...AdminEntryComponentList,
  ...InventoryEntryComponentList,
  ...WorkflowEntryComponentList,
  ...AccountingEntryComponentList
];

const HRCommonRoutes: any = [
  {
    path: "employee-list/:id",
    component: EmployeeListComponent,
    data: { title: "HR - Employees" }
  },
  {
    path: "employee-review",
    component: EmployeeReviewComponent,
    data: { title: "HR - Employees" }
  },
  {
    path: "new-employee",
    component: NewEmployeeComponent,
    data: { permission_slug: 'employee_add', title: "HR - Employees" },
    resolve: {
      empExtraFields: GetEmpDataResolver,
      serviceTypes: GetServiceTypeResolver
    },
    canActivate:[CanaccesGuardService]
  },
  {
    path: "sub-contractor-list/:id",
    component: SubContractorListComponent,
    data: { title: "HR - Sub-Contractor" }
  },
  {
    path: "add-subcontractor",
    component: AddSubContractorComponent,
    data: { permission_slug: 'subcontractor_add', title: "HR - Sub-Contractor" },
    resolve: {
      empExtraFields: GetSubContractorDataResolver,
      serviceTypes: GetServiceTypeResolver
    },
    canActivate:[CanaccesGuardService]
  },
  {
    path: "subcontractor-review",
    component: SubContractorReviewComponent,
    data: { title: "HR - Sub-Contractor" }
  }
];

const AdminCommonRoutes: any = [
  {
    path: "location-list/:id",
    component: LocationListComponent,
    data: {  title: "Admin - Locations" }
  },
  {
    path: "add-location",
    component: AddLocationComponent,
    data: {  title: "Admin - Locations" }
  },
  {
    path: "location-review",
    component: LocationReviewComponent,
    data: {  title: "Admin - Locations" }
  },
  {
    path: "manufacturer/:id",
    component: ManufacturerComponent,
    data: { title: "Admin - Manufacturers" }
  },
  {
    path: "manufacturer-part/:id",
    component: ManufacturerPartComponent,
    data: { title: "Admin - Item Definition" }
  },
  {
    path: "add-manufacturer-part/:id",
    component: AddManufacturerPartComponent,
    data: {permission_slug: "item_definition_create", title: "Admin - Item Definition" },
    canActivate: [CanaccesGuardService]
  },
  {
    path: "mfg-attributes",
    component: MfgAttributesComponent,
    data: { permission_slug: "item_definition_create", title: "Admin - Item Definition" },
    canActivate: [CanaccesGuardService]
  },
  {
    path: "manufacturer-part-review",
    component: ManufacturerPartReviewComponent,
    data: { permission_slug: "item_definition_create", title: "Admin - Item Definition" },
    canActivate: [CanaccesGuardService]
  },
  {
    path: "supplier-list/:id",
    component: SupplierListComponent,
    data: { title: "Admin - Suppliers" }
  },
  {
    path: "add-supplier",
    component: AddSupplierComponent,
    data: { permission_slug: "supplier_create",  title: "Admin - Suppliers" },
    canActivate: [CanaccesGuardService]
  },
  {
    path: "supplier-review",
    component: SupplierReviewComponent,
    data: {  title: "Admin - Supplier" }
  },
  {
    path: "service/:id",
    component: ServiceComponent,
    data: { title: "Admin - Services" }
  },
  {
    path: "add-service/:id",
    component: AddServiceComponent,
    data: { permission_slug: 'service_definition_create', title: "Admin - Services" },
    canActivate: [CanaccesGuardService]
  },
  {
    path: "review-service/:action",
    component: ReviewServiceComponent,
    data: { title: "Admin - Services" }
  }
];

const InventoryCommonRoutes: any = [
  {
    path: "add-asset",
    component: AddAssetComponent,
    data: { permission_slug: 'asset_create', title: "Inventory - Assets" },
    canActivate:[CanaccesGuardService]
  },
  {
    path: "asset-list/:id",
    component: AssetListComponent,
    data: {  title: "Inventory - Assets" }
  },
  {
    path: "asset-review",
    component: AssetReviewComponent,
    data: { title: "Inventory - Assets" }
  },
  {
    path: "add-product",
    component: AddProductComponent,
    data: { permission_slug: 'product_create', title: "Inventory - Products" },
    canActivate: [CanaccesGuardService]
  },
  {
    path: "product-list/:id",
    component: ProductListComponent,
    data: {  title: "Inventory - Products" }
  },
  {
    path: "product-review",
    component: ProductReviewComponent,
    data: {  title: "Inventory - Products" }
  },
  {
    path: "add-material",
    component: AddMaterialComponent,
    data: { permission_slug: 'material_create', title: "Inventory - Material" },
    canActivate:[CanaccesGuardService]
  },
  {
    path: "material-list/:id",
    component: MaterialListComponent,
    data: {  title: "Inventory - Material" }
  },
  {
    path: "material-review",
    component: MaterialReviewComponent,
    data: {  title: "Inventory - Material" }
  }
];

const routes: Routes = [
  { 
      path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login",
    component: LoginComponent,
    pathMatch: "full",
    data: { title: "Login" },
  },
  {
    path: "client-login",
    component: ClientLoginComponent,
    data: { title: "Login" }
  },

  {
    path: "forgot-credential-s1/:type",
    component: ForgotCredentialStepOneComponent,
    data: { title: "Forgot Credential" }
  },
  {
    path: "forgot-credential-s2/:status",
    component: ForgotCredentialStepTwoComponent,
    data: { title: "Forgot Credential" }
  },
  {
    path: "reset-credential-s2",
    component: ResetCredentialStepTwoComponent,
    data: { title: "Reset Credential" }
  },
  {
    path: "forgot-credential-s3",
    component: ForgotCredentialStepThreeComponent,
    data: { title: "Forgot Password" }
  },
  {
    path: "set-password-s1",
    component: SetPasswordStepOneComponent,
    data: { title: "Set Password" }
  },
  {
    path: "set-password-s2",
    component: SetPasswordStepTwoComponent,
    data: { title: "Set Password" }
  },

  {
    path: "company-users",
    component: CompanyUsersLandingComponent,
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        component: CompanyUsersDashboardComponent,
        data: { title: "Dashboard" }
      }
    ]/* ,
    canActivate: [RoleGuard],
    data: { expectedRole: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] } */ //'2'
  },
  {
    path: "csa",
    component: CSALandingComponent,
    children: [
      { path: "", redirectTo: "/c-dashboard/csa/summary", pathMatch: "full" },
      {
        path: "csv-preview/:type",
        component: CsvPreviewComponent,
        data: { title: "CSV Preview" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3] } // '2'
  },
  // Onboarding Routing
  {
    path: "csa-onboarding",
    component: CSAOnboardingComponent,
    children: [
      { path: "", redirectTo: "account-details", pathMatch: "full" },
      {
        path: "dashboard",
        component: CSAOnboardingDashboardComponent,
        data: { title: "Dashboard" }
      },
      {
        path: "account-details",
        component: AccountDetailsComponent,
        data: { title: "Account " }
      },
      {
        path: "edit-account",
        component: EditAccountComponent,
        data: { title: "Account" }
      },
      {
        path: "settings",
        component: SettingsComponent,
        canActivate: [RoleGuard],
        data: { title: "Settings ", expectedRole: [2] }
      },
      {
        path: "access-roles",
        component: AccessRolesComponent,
        canActivate: [RoleGuard],
        data: { title: "Access Roles ", expectedRole: [2] }
      },
      {
        path: "add-access-roles",
        component: AddAccessRoleComponent,
        data: { title: "Add Roles " }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3] }
  },
  // New CRM Routing
  {
    path: "crm/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "client-list/:id",
        component: NewClientListComponent,
        data: {  title: "CRM" }
      },
      {
        path: "add-client",
        component: NewAddClientComponent,
        data: { permission_slug: 'client_create', title: "CRM" },
        canActivate:[CanaccesGuardService],
      },
      {
        path: "client-review",
        component: NewClientReviewComponent,
        data: { title: "CRM" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3] }
  },
  {
    path: "crm/csa-onboarding",
    component: CSAOnboardingComponent,
    children: [
      {
        path: "client-list/:id",
        component: NewClientListComponent,
        data: { title: "CRM" }
      },
      {
        path: "add-client",
        component: NewAddClientComponent,
        data: { permission_slug: 'client_create', title: "CRM" },
        canActivate:[CanaccesGuardService]
      },
      {
        path: "client-review",
        component: NewClientReviewComponent,
        data: { title: "CRM" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3] }
  },
  //Dispatch Routing
  {
    path: "dispatch/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "dashboard",
        component: DispatchDashboardComponent,
        data: { title: "Dispatch" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3] }
  },
  //Accounting Routing
  {
    path: "account/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "acc-payables/:id",
        component: PayablesComponent,
        data: { title: "Financials - Payables" }
      },
      {
        path: "acc-receivables/:id",
        component: ReceivablesComponent,
        data: { title: "Financials - Receivables" }
      },
      {
        path: "invoice-list/:id",
        component: InvoiceListComponent,
        data: { title: "Financials - Invoice list" }
      },
      {
        path: "new-invoice",
        component: NewInvoiceComponent,
        data: {  permission_slug: 'invoice_create', title: "Financials - Create Invoice" },
        canActivate:[CanaccesGuardService]
      },
      {
        path: "ledger-list/:id",
        component: LedgerListComponent,
        data: { title: "Financials - Ledger" }
      },
      {
        path: "create-invoice",
        component: CreateInvoiceComponent,
        data: { title: "Financials - Create Invoice" }
      },
      {
        path: "new-invoice-without-quotation",
        component: CreateInvoiceWithoutQuoComponent,
        data: {  permission_slug: 'invoice_create', title: "Financials - Create Invoice" },
        canActivate:[CanaccesGuardService]
      },
      {
        path: "review-invoice",
        component: ReviewInvoiceComponent,
        data: { title: "Financials - Create Invoice" }
      },
      {
        path: "invoice-quote-review",
        component: InvoiceQuotationReviewComponent,
        data: { title: "Financials - Create Invoice" }
      },
      {
        path: "review-invoice-without-quotation",
        component: ReviewInvoiceWithoutQuoComponent,
        data: { title: "Financials - Create Invoice" }
      },
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3] }
  },
  //Dashboard(Reports) Routing
  {
    path: "c-dashboard/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "reports",
        component: SummaryComponent,
        data: { title: "Dashboard - Reports" }
      },
      {
        path: "summary",
        component: OldSummaryComponent,
        data: { title: "Dashboard - Summary" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3] }
  },
  //HR Routing
  {
    path: "hr/csa",
    component: CSALandingComponent,
    children: [
      ...HRCommonRoutes,
      {
        path: "timesheet-list/:id",
        component: TimesheetListComponent,
        data: { title: "HR - Timesheet" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "HR- Timesheet" }
  },
  {
    path: "hr/csa-onboarding",
    component: CSAOnboardingComponent,
    children: [...HRCommonRoutes],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "HR" }
  },
  //Admin Routing
  {
    path: "admin/csa-onboarding",
    component: CSAOnboardingComponent,
    children: [...AdminCommonRoutes],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Admin" }
  },
  {
    path: "admin/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "print-label",
        component: PrintLabelComponent,
        data: { title: "Admin - Labels" }
      },
      ...AdminCommonRoutes
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Admin" }
  },
  //Inventory Routing
  {
    path: "inventory/csa-onboarding",
    component: CSAOnboardingComponent,
    children: [...InventoryCommonRoutes],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Inventory" }
  },
  {
    path: "inventory/csa",
    component: CSALandingComponent,
    children: [
      ...InventoryCommonRoutes,
      {
        path: "maintenance-list/:id",
        component: MaintenanceListComponent,
        data: { title: "Inventory - Maintenance" }
      },
      {
        path: "tracker/:id",
        component: TrackerComponent,
        data: { title: "Inventory - Tracker" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Inventory" }
  },
  {
    path: "inventory/audit/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "audit-list/:id",
        component: AuditListComponent,
        data: { title: "Inventory - Audit" }
      },
      {
        path: "new-audit",
        component: NewAuditComponent,
        data: { permission_slug: 'audit_create', title: "Inventory - Audit" },
        canActivate:[CanaccesGuardService],
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Inventory" }
  },
  {
    path: "inventory/po/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "new-purchase-order",
        component: NewPurchaseOrderComponent,
        data: { permission_slug: 'po_create', title: "Inventory - Purchase order" },
        canActivate:[CanaccesGuardService]
      },
      {
        path: "purchase-order-list/:id",
        component: PurchaseOrderListComponent,
        data: { title: "Inventory - Purchase order" }
      },
      {
        path: "purchase-order-review",
        component: PurchaseOrderReviewComponent,
        data: { title: "Inventory - Purchase order" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Inventory" }
  },
  {
    path: "inventory/rs/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "receiving-slips-list/:id",
        component: ReceivingSlipsListComponent,
        data: { title: "Inventory - Receiving Slips" }
      },
      {
        path: "add-receiving-slip",
        component: AddReceivingSlipComponent,
        data: { permission_slug: 'rs_create', title: "Inventory - Receiving Slips" },
        canActivate:[CanaccesGuardService],
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Inventory" }
  },
  //Workflow Routing
  {
    path: "workflow/quote/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "quotation-list/:id",
        component: QuotationListComponent,
        data: { title: "Workflow - Project Estimator" }
      },
      {
        path: "client-selection",
        component: ClientSelectionComponent,
        data: { title: "Workflow - Project Estimator" }
      },
      {
        path: "quotation",
        component: QuotationGenerationComponent,
        data: { permission_slug: 'quotation_create', title: "Workflow - Project Estimator" },
        canActivate:[CanaccesGuardService],
        children: [
          {
            path: "services",
            component: ServicesComponent,
            data: { title: "Workflow - Project Estimator" }
          },
          {
            path: "materials",
            component: MaterialsComponent,
            data: { title: "Workflow - Project Estimator" }
          },
          {
            path: "schedule",
            component: ScheduleComponent,
            data: { title: "Workflow - Project Estimator" }
          },
          {
            path: "payment-schedule",
            component: PaymentScheduleComponent,
            data: { title: "Workflow - Project Estimator" }
          },
          {
            path: "images",
            component: ImagesComponent,
            data: { title: "Workflow - Project Estimator" }
          }
        ]
      },
      {
        path: "quotation-review",
        component: QuotationReviewComponent,
        data: { title: "Workflow - Project Estimator" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Workflow" }
  },
  {
    path: "workflow/wo/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "work-order",
        component: WorkOrderComponent,
        data: { permission_slug: 'wo_create', title: "Workflow - Work Orders" },
        canActivate:[CanaccesGuardService],
        children: [
          {
            path: "services",
            component: WOServicesComponent,
            data: { title: "Workflow - Work Orders" }
          },
          {
            path: "team",
            component: TeamComponent,
            data: { title: "Workflow - Work Orders" }
          },
          {
            path: "assets",
            component: WOAssetsComponent,
            data: { title: "Workflow - Work Orders" }
          },
          {
            path: "products",
            component: ProductsComponent,
            data: { title: "Workflow - Work Orders" }
          }
        ]
      },
      {
        path: "work-order-list/:id",
        component: WorkOrderListComponent,
        data: { title: "Workflow - Work Orders" }
      },
      {
        path: "work-order-review",
        component: WorkOrderReviewComponent,
        data: { title: "Workflow - Work Orders" }
      },
      {
        path: "wo-quotation-review",
        component: WoQuotationReviewComponent,
        data: { title: "Workflow - Work Orders" }
      },
      {
        path: "wo-setup",
        component: WoSetupComponent,
        data: { title: "Workflow - Work Orders" }
      },
      {
        path: "wo-sub-contractor",
        component: WoSubContractorComponent,
        data: { title: "Workflow - Work Orders" }
      },
      {
        path: "wo-contractor-review",
        component: WoContractorReviewComponent,
        data: { title: "Workflow - Work Orders" }
      },
      {
        path: "wo-external",
        component: ExternalWorkOrderComponent,
        data: { permission_slug: 'wo_create', title: "Workflow - Work Orders" },
        canActivate:[CanaccesGuardService],
        children: [
          {
            path: "services",
            component: WOServicesComponent,
            data: { title: "Workflow - Work Orders" }
          },
          {
            path: "team",
            component: TeamComponent,
            data: { title: "Workflow - Work Orders" }
          },
          {
            path: "assets",
            component: WOAssetsComponent,
            data: { title: "Workflow - Work Orders" }
          },
          {
            path: "products",
            component: ProductsComponent,
            data: { title: "Workflow - Work Orders" }
          }
        ]
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3], title: "Workflow" }
  },
  {
    path: "workflow/schedule/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "add-schedule/:type",
        component: AddScheduleComponent,
        data: { title: "Workflow - Scheduling" }
      },
      {
        path: "schedule-review/:type",
        component: ScheduleReviewComponent,
        data: { title: "Workflow - Scheduling" }
      },
      {
        path: "schedule-list/:id",
        component: ScheduleListComponent,
        data: { title: "Workflow - Scheduling" }
      },
      {
        path: "schedule-timeline",
        component: ScheduleTimelineComponent,
        data: { title: "Workflow - Scheduling" },
      },
      {
        path: "add-timeline-schedule/:type/:id",
        component: AddTimelineScheduleComponent,
        data: { permission_slug : 'schedule_add', title: "Workflow - Add timeline schedule" },
        canActivate:[CanaccesGuardService]
      },
      {
        path: "timeline-schedule-review/:type",
        component: TimelineScheduleReviewComponent,
        data: { title: "Workflow - Schedule Review" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [2, 3] }
  },

  //Messaging Routing
  {
    path: "message/csa",
    component: CSALandingComponent,
    children: [
      {
        path: "messaging",
        component: MessagingComponent,
        data: { title: "Messaging" }
      }
    ]
  },
  //Trea Super Admin Routing
  {
    path: "su/tsa",
    component: TSALandingComponent,
    children: [
      { path: "", redirectTo: "dashboard/0", pathMatch: "full" },
      {
        path: "dashboard/:id",
        component: TSADashboardComponent,
        data: { title: "Dashboard" }
      },
      {
        path: "error-log",
        component: ErrorLogComponent,
        data: { title: "Error Log" }
      },
      {
        path: "company-registration",
        component: CompanyRegistrationComponent,
        data: { title: "Company Registeration" }
      },
      {
        path: "users-list/:compId/:id",
        component: EmployeeDetailComponent,
        data: { title: "User List" }
      },
      {
        path: "add-user/:id",
        component: NewEmployeeComponent,
        data: { title: "Add User" }
      },
      {
        path: "user-review/:id",
        component: EmployeeReviewComponent,
        data: { title: "User Review" }
      }
    ],
    canActivate: [RoleGuard],
    data: { expectedRole: [1] }
  },
  {
    path: "email-link",
    loadChildren:
      "./component/email-template/email-template.module#EmailTemplateModule"
  },

{ path: "unauthorized-access", component: UnauthorizedAccessComponent, data: { title: "Unauthorized Acces " } },
  { path: "**", redirectTo: "404", pathMatch: "full" },
  { path: "404", component: E404Component, data: { title: "404" } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  providers: [
    GetEmpDataResolver,
    GetServiceTypeResolver,
    GetSubContractorDataResolver
  ]
})
export class AppRoutingModule { }
