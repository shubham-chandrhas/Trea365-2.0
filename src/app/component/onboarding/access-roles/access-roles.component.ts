import { Component, ViewChild, OnInit, AfterViewInit} from "@angular/core";
import { HttpService } from "./../../../shared/service/http.service";
import { Router, ActivatedRoute } from "@angular/router";
import { UtilService } from "../../../shared/service/util.service";
import { ConstantsService } from "../../../shared/service/constants.service";
import { ITreeOptions, IActionMapping, TreeModule, TREE_ACTIONS, KEYS, } from "angular-tree-component";
@Component({
  selector: "app-checkboxes",
  templateUrl: "./access-roles.html",
  styleUrls: ["./access-roles.component.scss"],
})
export class AccessRolesComponent implements OnInit, AfterViewInit {
  public paginationKey: any;
  public listCount:number = 0;
  public searchTxt: any;
  public sortColumn: string = "role_id";
  public sortColumnType: string = "A";
  public sortOrder: string = "DSC";
  AccessroleTab = "Inventory";
  isWoDisableTab = "1";
  isStaffDisableTab = "1";
  selectedStaff = "0";
  selectedWo = "0";
  isExpandedField = "0";
  searchList: any;
  nameSearch: any;
  definitionSearch: any;
  roleList: any = [];
  permissionsObj: any = [];
  selectedIndex: number;
  permissionObj: any;
  imgSrc = "https://devtrea.s3.us-east-2.amazonaws.com/public/company_6/attachments/images/1565093150.png";
  @ViewChild("tree") tree;

  options: ITreeOptions = {
    // useCheckbox: true,
    isExpandedField: "expanded",
    animateExpand: true,
    useTriState: true
  };

  optionsDisabled: ITreeOptions = {
    //  useCheckbox: false
  };

  constructor(
    public router: Router,
    public util: UtilService,
    private route: ActivatedRoute,
    private http: HttpService,
    public constant: ConstantsService
  ) {}

  ngOnInit() {
    this.util.showProcessing("processing-spinner");
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.getRoleList();
    this.util.menuChange({
      "menu": "AccessRoles",
      "subMenu": ""
    });
     this.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
  }
  ngAfterViewInit() {
    // setTimeout(() => {
    //   this.tree.treeModel.expandAll();
    //   console.log(this.tree);
    // }, 0);
  }
  getRoleList() {
    this.http.doGet(`permission/roles`, (error: boolean, response: any) => {
      this.util.hideProcessing("processing-spinner");
      if (error) {
        // this.roleList = this.response.data;
      } else {
        this.roleList = response.data;
      }
    });
  }
  getSelectedRole(id, index) {
    this.util.showProcessing("processing-spinner");
    this.selectedIndex = index;
    this.http.doGet(`permission/roles/${id}/details`, (error: boolean, response: any) => {
      this.util.hideProcessing("processing-spinner");
      if (error) {
        // this.permissionsObj = this.response.data;
      } else {
        this.permissionObj = response.data;
        this.permissionsObj = response.data.permissions;
        setTimeout(() => {
        this.util.scrollDown("role-details");
      }, 500);
      }
    });
  }
  editPermission() {
    sessionStorage.setItem("permissionObj", JSON.stringify(this.permissionObj));
    this.router.navigate(["csa-onboarding/add-access-roles"]);
  }
  changeAccessrolesTab(tabName) {
    this.AccessroleTab = tabName;
  }

  onTreeLoad(tree): void {
    tree.treeModel.expandAll();
  }
  newRole() {
     this.router.navigate(["csa-onboarding/add-access-roles"]);
  }

  changePage(event) {
    this.paginationKey.currentPage = event;
    window.scrollTo(0, 0);
  }
  changeItemPerPage() {
    window.scrollTo(0, 0);
  }
  updateCount(count) {
    this.constant.ITEM_COUNT = count;
    this.listCount = count;
  }
  getSearchTxt(filterValue: string) {
    if (filterValue == "") {
      this.searchTxt = "";
    }
  }
  sortList(columnName: string, sortType) {
    this.sortColumn = columnName;
    this.sortColumnType = sortType;
    if (this.sortColumn === columnName) {
      if (this.sortOrder === "ASC") {
        this.sortOrder = "DSC";
      } else {
        this.sortOrder = "ASC";
      }
    } else {
      this.sortOrder = "ASC";
    }
  }
}
