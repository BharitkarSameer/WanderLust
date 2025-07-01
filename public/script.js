
function dismissAlert() {
    const alertBox = document.getElementById("flash-alert");
    if (alertBox) {
      alertBox.style.display = "none";
    }
}


function dismissDangerAlert(id) {
    const alertBox = document.getElementById(id);
    if (alertBox) {
      alertBox.style.display = "none";
    }
} 

//image upload


  // const uploadInput = document.getElementById("upload-image");
  // const fileNameDisplay = document.getElementById("selected-file-name");

  // uploadInput.addEventListener("change", function () {
  //   fileNameDisplay.textContent = this.files[0]?.name || "No file chosen";
  // });


