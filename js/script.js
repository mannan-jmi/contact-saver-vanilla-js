// API Config
let API_END_POINT = "https://school-management-sg8k.onrender.com";
let STATIC_TOKEN = "7aa4f9501995f1ede2ccab611adf61a0377757e4dc8b2d06ff6fcad72f0834f8";

// Interceptor to add auth token in all axios api header to authenticate api
axios.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${STATIC_TOKEN}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Element selected constant
let contactSaverModal = document.getElementById("contactSaverModal");
let viewContactModal = document.getElementById("viewContact");
let nameFieldEl = document.getElementById("name");
let phoneFieldEl = document.getElementById("phone");
let typeEl = document.getElementById("type");
let addressEl = document.getElementById("address");
let nameErrorEl = document.getElementById("nameError");
let phoneNumberErrorEl = document.getElementById("phoneNumberError");
let tbodyEl = document.getElementById("tbody");
let exampleModalLabelEL = document.getElementById("exampleModalLabel");
let saveOrUpdateBtnEl = document.getElementById("saveOrUpdateBtn");
let dataIdForUpdateEl = document.getElementById("dataIdForUpdate");
let searchEl = document.getElementById("search");
let viewContactBodyEl = document.getElementById("view-contact-body");
let inputRightIconEl = document.getElementById("input-right-icon");

// Plugins or third party library instances
// Create an instance of Notyf
var notify = new Notyf({
  duration: 5000,
});

// Create an instance of Modal
var myModal = new bootstrap.Modal(contactSaverModal);
var viewModal = new bootstrap.Modal(viewContactModal);

// constant to store contacts data
var CONTACTS_DATA = [];
var RECORDS_PER_PAGE_LIMIT = 10;

/**
 * Function to generate loader
 */
const loader = () => {
  return `
    <div class="loader" id="loader">
      <img src="./images/loader.gif" alt="Loading..." />
    </div>
  `;
};

/**
 * Function to show loader for whole page with z-index
 */
const showLoader = () => {
  document.getElementById("loader-container").innerHTML = loader();
};

/**
 * Function to hide loader
 */
const hideLoader = () => {
  document.getElementById("loader-container").innerHTML = "";
};

/**
 * Function to show search spinner in search input and hide search icon
 */
const showInputSpinner = () => {
  let iconHtml = "";
  let searchInputValue = searchEl.value;
  if (searchInputValue) {
    iconHtml = `<i class="spinner-border spinner-border-sm text-primary position-absolute loader-icon"></i>`;
  }
  inputRightIconEl.innerHTML = iconHtml;
};

/**
 * Function to show to hide spinner when api got response and show clear button
 */
const hideInputSpinnerShowClearBtn = () => {
  let iconHtml = "";
  let searchInputValue = searchEl.value;
  if (searchInputValue !== "") {
    iconHtml = `<i class="fa fa-close clear-icon position-absolute"></i>`;
  }
  inputRightIconEl.innerHTML = iconHtml;
};

/**
 * Function get data from api
 */
const fetchContacts = async (page = 1, searchInputValue, filter) => {
  try {
    let url = `${API_END_POINT}/v1/api/micro/contact?page=${page}&limit=${RECORDS_PER_PAGE_LIMIT}`;
    if (filter) {
      url = `${url}&type=${filter}`;
    }
    if (searchInputValue) {
      url = `${url}&search=${searchInputValue}`;
    } else {
      showLoader();
    }
    const response = await axios.get(url);
    CONTACTS_DATA = response.data;
    renderData();
    hideLoader();
  } catch (error) {
    hideLoader();
    notify.error(error.message);
  }
};

// On load fetch contacts from api
fetchContacts();

/**
 * Function to search contacts
 */
let debounceTimeout = null;
const searchContact = async () => {
  clearTimeout(debounceTimeout); // Clear the last timer
  try {
    showInputSpinner();
    debounceTimeout = setTimeout(async () => {
      let q = searchEl.value;
      fetchContacts(1, q, null);
      hideInputSpinnerShowClearBtn();
    }, 300);
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
  }
};

/**
 * Function to get data on click pagination with search input value
 */
const getDataByPagination = (page) => {
  let q = searchEl.value;
  fetchContacts(page, q);
};

/**
 * Function to make pagination in UI
 */
const paginationHtml = () => {
  const total = CONTACTS_DATA.total;
  const limit = CONTACTS_DATA.limit;
  const totalPages = Math.ceil(total / limit);

  let prevBtn = `
    <li class="page-item ${CONTACTS_DATA.page == 1 ? "disabled" : ""}">
      <a
        class="page-link"
        href="javascript:void();"
        onClick='getDataByPagination(${CONTACTS_DATA.page - 1})'
      >
        Previous
      </a>
    </li>
  `;

  let paginationLi = "";
  for (i = 1; i <= totalPages; i++) {
    paginationLi += `<li class="page-item">
        <a
          class="page-link ${CONTACTS_DATA.page == i ? "active" : ""}"
          href="javascript:void();"
          onClick='getDataByPagination(${i})'
        >
          ${i}
        </a>
    </li>`;
  }

  let nextBtn = `
    <li class="page-item ${CONTACTS_DATA.page == totalPages ? "disabled" : ""}">
      <a
        class="page-link"
        href="javascript:void();"
        onClick='getDataByPagination(${CONTACTS_DATA.page + 1})'
      >
        Next
      </a>
    </li>
  `;
  const finalHtml = prevBtn + paginationLi + nextBtn;
  document.getElementById("pagination-ul").innerHTML = finalHtml;
};

/**
 * Function to render data in table from CONTACTS_DATA constant
 */
const renderData = async () => {
  try {
    let rowHtml = "";
    paginationHtml();
    if (CONTACTS_DATA.data.length) {
      CONTACTS_DATA.data.forEach((item, index) => {
        const serialNumber = (CONTACTS_DATA.page - 1) * RECORDS_PER_PAGE_LIMIT + index + 1;
        rowHtml += `<tr>
        <td>${serialNumber}</td>
        <td>${capitalizeWords(item.name)}</td>
        <td>${item.phone}</td>
        <td>${capitalizeWords(item.type)}</td>
        <td>
          <div class="d-flex flex-nowrap justify-content-end gap-2">
            <button class="btn btn-info btn-sm" onclick="viewContact('${item._id}')">
              <i class="fa fa-eye"></i>
              <span class="action-btn">View</span>
            </button>
            <button class="btn btn-success btn-sm" onclick="showModal('${item._id}')">
              <i class="fa fa-edit"></i>
              <span class="action-btn">Edit</span>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteContact('${item._id}')">
              <i class="fa fa-trash"></i>
              <span class="action-btn">Delete</span>
            </button>
          </div>
        </td>
      </tr>`;
      });
    } else {
      rowHtml += `<tr>
        <td colspan="5">No records found!</td>
      </tr>`;
    }

    tbodyEl.innerHTML = rowHtml;
  } catch (error) {
    notify.error(error.message);
  }
};

/**
 * Function to show modal
 */
const showModal = (_id) => {
  if (_id) {
    let selectedIdData = CONTACTS_DATA.data.find((item) => item._id == _id);
    exampleModalLabelEL.innerHTML = "Update Contact";
    nameFieldEl.value = selectedIdData.name;
    phoneFieldEl.value = selectedIdData.phone;
    typeEl.value = selectedIdData.type;
    addressEl.value = selectedIdData.address ? selectedIdData.address : "";
    dataIdForUpdateEl.value = selectedIdData._id;
    saveOrUpdateBtnEl.value = "Update";
    myModal.show();
  } else {
    exampleModalLabelEL.innerHTML = "New Contact";
    nameFieldEl.value = "";
    phoneFieldEl.value = "";
    typeEl.value = "home";
    addressEl.value = "";
    dataIdForUpdateEl.value = "";
    saveOrUpdateBtnEl.value = "Save";
    myModal.show(); // open modal for new add contact
  }
};

/**
 * Function to submit form
 */
const saveOrUpdate = async (e) => {
  try {
    e.preventDefault();

    const name = nameFieldEl.value;
    const phone = phoneFieldEl.value;
    const type = typeEl.value;
    const address = addressEl.value;
    const id = dataIdForUpdateEl.value;

    const isValid = validateForm(name, phone);
    if (!isValid) return;

    const payload = { name, phone, type, address };

    if (id) {
      await axios.put(`${API_END_POINT}/v1/api/micro/contact/${id}`, payload);
      addOrUpdateSuccessMessage("Contact updated successfully!");
      return; // To break or stop execution here
    }
    await axios.post(`${API_END_POINT}/v1/api/micro/contact/${id}`, payload);
    addOrUpdateSuccessMessage("You have saved contact successfully!");
  } catch (error) {
    let errorMsg = "";
    let defaultErrorMsg = "Internal Server Error, Please try after some time";
    errorMsg = error.response.data.error.message || error.message || defaultErrorMsg;
    notify.error(errorMsg);
  }
};

/**
 * Function to reset form and show success add or update message and re-render
 * @param {string} msg
 */
const addOrUpdateSuccessMessage = (msg) => {
  fetchContacts();
  closeModalAndResetForm();
  notify.success(msg);
};

/**
 * Function to close modal and reset name and phone input value
 */
const closeModalAndResetForm = () => {
  myModal.hide();
  nameFieldEl.value = "";
  phoneFieldEl.value = "";
  dataIdForUpdateEl.value = "";
};

/**
 * Function to validate
 */
function validateForm(name, phoneNumber) {
  let isFormValid = false;
  if (name === "") {
    nameErrorEl.innerHTML = "Required field!";
    isFormValid = false;
  } else {
    nameErrorEl.innerHTML = "";
    isFormValid = true;
  }

  if (phoneNumber === "" || phoneNumber.length < 10 || phoneNumber.length > 10) {
    phoneNumberErrorEl.innerHTML = "Required field! Must be 10 digit!";
    isFormValid = false;
  } else {
    phoneNumberErrorEl.innerHTML = "";
    isFormValid = true;
  }

  return isFormValid;
}

/**
 * Function to delete contact based on id
 */
const deleteContact = async (id) => {
  try {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await axios.delete(`${API_END_POINT}/v1/api/micro/contact/${id}`);
        fetchContacts();
        Swal.fire({
          title: "Deleted!",
          text: "Successfully deleted!",
          icon: "success",
        });
      }
    });
  } catch (error) {
    notify.error(error.message);
  }
};

/**
 * Function capitalize of single word e.g anas become Anas
 */
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Function capitalize of whole sentence word e.g anas khan become Anas Khan
 */
const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

/**
 * Function to show contacts details in modal or popup
 */
const viewContact = (id) => {
  let selectedIdData = CONTACTS_DATA.data.find((item) => item._id == id);
  if (selectedIdData) {
    viewContactBodyEl.innerHTML = `
      <div
        class="card border-0 shadow-lg rounded-4 mx-auto position-relative"
        style="max-width: 500px; backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.85)"
      >
        <!-- Custom Close Button -->
        <button
          type="button"
          class="btn-close position-absolute end-0 m-3 z-3"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>

        <!-- Avatar & Header -->
        <div class="card-header text-center bg-white border-0 rounded-top-4">
          <img
            src="https://ui-avatars.com/api/?name=${
              selectedIdData.name
            }&background=007bff&color=fff&rounded=true&size=80"
            class="rounded-circle shadow-sm mb-2"
            alt="Avatar"
          />
          <h5 class="fw-bold mb-1">${capitalizeWords(selectedIdData.name)}</h5>
          <span class="text-muted small">${capitalize(selectedIdData.type)} Contact</span>
        </div>

        <!-- Info Rows -->
        <div class="card-body px-4 py-4">
          <div class="mb-3 d-flex align-items-center">
            <i class="bi bi-telephone-fill text-primary me-3 fs-5"></i>
            <div>
              <div class="text-muted small">Phone</div>
              <div class="fw-semibold text-dark">${selectedIdData.phone}</div>
            </div>
          </div>
          <div class="mb-3 d-flex align-items-center">
            <i class="bi bi-geo-alt-fill text-danger me-3 fs-5"></i>
            <div>
              <div class="text-muted small">Address</div>
              <div class="fw-semibold text-dark">${selectedIdData.address || "N/A"}</div>
            </div>
          </div>
          <div class="d-flex align-items-center">
            <i class="bi bi-house-door-fill text-info me-3 fs-5"></i>
            <div>
              <div class="text-muted small">Type</div>
              <div class="fw-semibold text-dark">${capitalize(selectedIdData.type)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    viewModal.show();
  }
};
