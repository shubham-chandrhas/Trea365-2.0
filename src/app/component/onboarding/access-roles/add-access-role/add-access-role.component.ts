import { Component, ViewChild, OnInit, AfterViewInit, OnDestroy, DoCheck} from "@angular/core";
import {FormControl, Validators, FormGroup, FormBuilder } from "@angular/forms";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { ITreeOptions, IActionMapping, TreeModule, TREE_ACTIONS, KEYS, } from "angular-tree-component";
import { HttpService } from "../../../../shared/service/http.service";
import { UtilService } from "../../../../shared/service/util.service";
import { ActivatedRoute, Router } from "@angular/router";
@Component({
  selector: "app-add-access-role",
  templateUrl: "./add-access-role.component.html",
  styleUrls: ["./add-access-role.component.scss", "../access-roles.component.scss"]
})
export class AddAccessRoleComponent implements OnInit, OnDestroy {
  addRoleFm: FormGroup;
  submitted = false;
  AccessroleTab = "Inventory";
  permissionsObj: any = [];
  getEditData: any;
  isDisabled: boolean;
  @ViewChild("tree") tree;
  options: ITreeOptions = {
    // useCheckbox: true,
    isExpandedField: "expanded",
    animateExpand: true,
    useTriState: false
  };
  optionsDisabled: ITreeOptions = {
     useCheckbox: true,
  };
  edit = false;
  constructor(
    private constant: ConstantsService,
    private http: HttpService,
    private util: UtilService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.util.menuChange({
      "menu": "AccessRoles",
      "subMenu": ""
    });
    this.getEditData = sessionStorage.getItem("permissionObj");
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.createRoleForm();
    if (this.getEditData) {
      const data = JSON.parse(this.getEditData);
      this.edit = true;
      this.updateFormData(JSON.parse(this.getEditData));
      this.permissionsObj = data.permissions;
    } else {
      this.isDisabled = true;
      this.getPermissionDef();
    }
  }
  ngOnDestroy() {
    sessionStorage.removeItem("permissionObj");
  }
  updateFormData(data) {
    this.addRoleFm.patchValue(
      data
    );
  }
  changeAccessrolesTab(tabName) {
    this.AccessroleTab = tabName;
    this.setManagmentData(tabName);
  }
  createRoleForm() {
    this.addRoleFm = this.fb.group({
      permission_role_id: new FormControl(""),
      role_name: new FormControl("", [Validators.required
        // Validators.maxLength(this.constant.DEFAULT_NAME_MAXLENGTH)
      ]),
      description: new FormControl("", [
        // Validators.minLength(2),
        // Validators.maxLength(this.constant.DEFAULT_COMMENT_MAXLENGTH)
      ])
    });
  }
  getPermissionDef() {
    this.util.showProcessing("processing-spinner");
    this.http.doGet(`permission/definitions`, (error: boolean, response: any) => {
      this.util.hideProcessing("processing-spinner");
      if (error) {
        // this.permissionsObj = this.response.data;
      } else {
        this.permissionsObj = response.data;
      }
    });
  }
  get permission_role_id() {
    return this.addRoleFm.get("permission_role_id");
  }
  get role_name() {
    return this.addRoleFm.get("role_name");
  }
  get description() {
    return this.addRoleFm.get("description");
  }
  addRole(form: FormGroup) {
    this.submitted = true;
    if (form.valid) {
      this.util.showProcessing("processing-spinner");
      const reqObj = {
        permission_role_id: form.value.permission_role_id,
        role_name: form.value.role_name,
        description: form.value.description,
        permissions: this.permissionsObj
      };
      try {
        // this.util.addSpinner("add-role-btn", "Submit");
        this.http.doPost("permission/save/role-permission", reqObj, (
          error: boolean,
          response: any
        ) => {
            this.util.hideProcessing("processing-spinner");
          if (error) {

          } else {
            sessionStorage.removeItem("permissionObj");
            this.router.navigate(["csa-onboarding/access-roles"]);
          }
        });
      } catch (err) {

      }
    }
  }
  backTolist() {
    sessionStorage.removeItem("permissionObj");
    this.router.navigate(["csa-onboarding/access-roles"]);
  }
  onSelect(event, node, type? ) {
     node.data.children.map((item) => {
       item.status = event.target.checked ? 1 : 0;
       item.is_changed = 1;
       item.children.map((childItem) => {
           childItem.status = event.target.checked ? 1 : 0;
           childItem.is_changed = 1;
       });
     });
    node.data.status  = event.target.checked ? 1 : 0;
    node.data.is_changed = 1;
    if (type == "access") {
    node.data.status == 0 ? (this.isDisabled = true, this.resetManagmentTree(this.AccessroleTab)) : this.isDisabled = false;
    }
  //  console.log(this.permissionsObj);
  }

  resetManagmentTree(tabName) {
   this.setManagmentData(tabName, "isReset");
  }
  setManagmentData(tabName, isReset? ) {
       this.permissionsObj.map((item) => {
      if (item.menu_name == tabName && item.access.length == 0 ) {
        this.isDisabled = false;
      } else if (item.menu_name == tabName && item.access.length > 0 && isReset ) {
          this.setNodeValues(item);
      }
    });
  }
  setNodeValues(node) {
      node.management.map((item) => {
        item.status = 0;
        item.is_changed = 1;
        item.children.map((childItem) => {
          childItem.status = 0;
          childItem.is_changed = 1;
          childItem.children.map((grandChildItem) => {
            grandChildItem.status = 0;
            grandChildItem.is_changed = 1;
        });
      });
    });
  }
   onTreeLoad(tree) {
     tree.treeModel.expandAll();
  }
  setDisabledValue(value) {
    this.isDisabled = value;
    // console.log(this.isDisabled);
  }
}
