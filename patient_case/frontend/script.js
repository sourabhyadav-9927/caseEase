
const toggle = document.getElementById("themeToggle");
      toggle.addEventListener("change", () => {
        document.body.classList.toggle("dark");
      });
const patientName = document.getElementById("patient_name");
const patientAge = document.getElementById("patient_age");
const patientGender = document.getElementById("patient_gender");
const patientChiefComplaint = document.getElementById("patient_chief_complaint");


function savePatientData(event) {

    // Stop the form from refreshing the page
    event.preventDefault();

    const name = patientName.value;
    const age = patientAge.value;
    const gender = patientGender.value;
    const chiefComplaint = patientChiefComplaint.value;

    console.log("Name:", name);
    console.log("Age:", age);
    console.log("Gender:", gender);
    console.log("Complaint:", chiefComplaint);

    // Save data
    sessionStorage.setItem("patientName", name);
    sessionStorage.setItem("age", age);
    sessionStorage.setItem("gender", gender);
    sessionStorage.setItem("chiefComplaint", chiefComplaint);

    console.log("Data saved!");

    // Check what was saved
    console.log(sessionStorage.getItem("patientName"));
    console.log(sessionStorage.getItem("age"));
    console.log(sessionStorage.getItem("gender"));
    console.log(sessionStorage.getItem("chiefComplaint"));

    // Go to next page
    window.location.href = "patient-detail.html";
}