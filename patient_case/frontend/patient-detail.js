// ===============================
// 1. GET HTML ELEMENTS
// ===============================

const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const patientName = document.getElementById("patientName");
const patientAge = document.getElementById("patientAge");
const patientGender = document.getElementById("patientGender");
const chiefComplaint = document.getElementById("chiefComplaint");

// Backend URL: local FastAPI while developing, Render when deployed.
// After deploying the backend, replace the Render URL below.
const API_URL =
    ["localhost", "127.0.0.1", ""].includes(location.hostname)
        ? "http://localhost:8000"
        : "https://caseease-8zgn.onrender.com";

const typing = document.getElementById("typing");
const apiError = document.getElementById("apiError");
let numberofTurnes = 1;

let pastConvo = [];
console.log("patientName:", patientName);
console.log("patientAge:", patientAge);
console.log("patientGender:", patientGender);
console.log("chiefComplaint:", chiefComplaint);

// ===============================
// 2. GET PATIENT DATA
// ===============================

// Example:
// case.html?name=Sourabh&age=20&gender=Male&chief_complaint=Headache

const name = sessionStorage.getItem("patientName");
const age = sessionStorage.getItem("age");
const gender = sessionStorage.getItem("gender");
const complaint = sessionStorage.getItem("chiefComplaint");


// Show patient information

if (name) {
    patientName.textContent = name;
}

if (age) {
    patientAge.textContent = age;
}

if (gender) {
    patientGender.textContent = gender;
}

if (complaint) {
    chiefComplaint.textContent = complaint;
}


// ===============================
// 3. ADD MESSAGE TO CHAT
// ===============================

function addMessage(message, sender) {

    const messageDiv = document.createElement("div");

    messageDiv.classList.add("message");
    messageDiv.classList.add(sender);

    // AI message
    if (sender === "ai") {

        messageDiv.innerHTML = `
            <div class="avatar">CE</div>

            <div class="bubble-wrap">

                <div class="ai-name">
                    CaseEase AI
                </div>

                <div class="bubble">
                    ${message}
                </div>

            </div>
        `;
        if(numberofTurnes > 1) {
            pastConvo.push(`ai: ${message}`);
        }
        numberofTurnes++;
    }

    // Patient message
    else {

        messageDiv.innerHTML = `
            <div class="bubble-wrap">

                <div class="bubble">
                    ${message}
                </div>

            </div>
        `;
        if(numberofTurnes > 1) {
            pastConvo.push(`user: ${message}`);
        }
        numberofTurnes++;
    }
    console.log("pastConvo:", pastConvo);
    chatContainer.appendChild(messageDiv);

    // Automatically scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


// ===============================
// 4. SHOW TYPING
// ===============================

function showTyping() {
    typing.classList.add("visible");

    chatContainer.scrollTop = chatContainer.scrollHeight;
}


function hideTyping() {
    typing.classList.remove("visible");
}


// ===============================
// 5. SEND MESSAGE TO BACKEND
// ===============================

async function sendMessage() {

    const message = messageInput.value.trim();

    // Don't send empty messages
    if (message === "") {
        return;
    }

    // Show patient's message
    addMessage(message, "user");

    // Clear input box
    messageInput.value = "";

    // Disable button while waiting
    sendBtn.disabled = true;
    messageInput.disabled = true;

    showTyping();

    try {

        // Send data to FastAPI
        const response = await fetch(`${API_URL}/case/chat`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name: name,
                age: age,
                gender: gender,
                chief_complaint: complaint,
                past_conversation: pastConvo,
                message: message

            })
        });


        // Check if backend returned an error
        if (!response.ok) {
            throw new Error("Server error");
        }

        console.log("Response received from backend:", response);
        // Convert backend response to JavaScript object
        const data = await response.json();
        console.log("Data received from backend:", data);

        hideTyping();
        
        
        // Show AI response
        addMessage(data.response, "ai");


    } catch (error) {

        hideTyping();

        apiError.textContent =
            "Unable to connect to the server. Please try again.";
            
            apiError.classList.add("visible");
            
            console.log(error);

        }
        
        
        // Enable input again
        sendBtn.disabled = false;
        messageInput.disabled = false;
        
        messageInput.focus();
    }
    
//sendMessage();

// ===============================
// 6. PRESS ENTER TO SEND
// ===============================

function handleKey(event) {

    // Enter without Shift
    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();
    }
}


// ===============================
// 7. END CASE
// ===============================

function endCase() {

    const confirmEnd = confirm(
        "Are you sure you want to end this case?"
    );

    if (confirmEnd) {

        // Go back to home page
        window.location.href = "index.html";
    }
}


// ===============================
// 8. FIRST AI MESSAGE
// ===============================

window.addEventListener("load", function () {

    if (numberofTurnes === 1) {

        addMessage(
            `Hello ${name}. I will ask you a few questions about your condition. Please answer them as clearly as you can. \n Enter "continue" to proceed.`,
            "ai"
        );
        numberofTurnes++;

    }
    /*else if(numberofTurnes > 1) {

        addMessage(data.response, "ai");
    }*/

});