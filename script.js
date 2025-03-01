let displayValue = '';
let conversationHistory = [];
const maxHistoryLength = 100000000000000000000; // Maximum character limit for AI assistant

function appendToDisplay(value) {
    displayValue += value;
    document.getElementById('display').value = displayValue;
}

function clearDisplay() {
    displayValue = '';
    document.getElementById('display').value = displayValue;
}

function backspace() {
    displayValue = displayValue.slice(0, -1);
    document.getElementById('display').value = displayValue;
}

function calculate() {
    try {
        // Replace Math.pow with ** for compatibility
        let expression = displayValue.replace(/Math\.pow\(/g, '(').replace(/\)/g, ')');
        expression = expression.replace(/Math\.sqrt\(/g, '(').replace(/\)/g, ')');
        expression = expression.replace(/Math\.sin\(/g, '(').replace(/\)/g, ')');
        expression = expression.replace(/Math\.cos\(/g, '(').replace(/\)/g, ')');
        expression = expression.replace(/Math\.tan\(/g, '(').replace(/\)/g, ')');
        expression = expression.replace(/π/g, 'Math.PI');
        
        // Use math.js to evaluate the expression
        let result = math.evaluate(expression);
        document.getElementById('display').value = result;
        displayValue = String(result);
    } catch (error) {
        document.getElementById('display').value = 'Error';
        displayValue = '';
    }
}

async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === '') return;

    // Display user message
    displayMessage(userInput, 'user');

    // Prepare message for AI
    const newMessage = {
        role: "user",
        content: userInput,
    };
    conversationHistory.push(newMessage);

    // Check and trim history length
    let historyLength = 0;
    for (let i = 0; i < conversationHistory.length; i++) {
        historyLength += conversationHistory[i].content.length;
    }

    while (historyLength > maxHistoryLength && conversationHistory.length > 1) {
        const removedMessage = conversationHistory.shift();
        historyLength -= removedMessage.content.length;
    }

    // Call the AI model
    try {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a helpful high school tutor. Provide accurate and concise answers in an official style. Always structure your responses in an orderly manner using topics and subtopics. Use formatting, bullet points, and numbering where appropriate to enhance readability and organization. Format your responses with markdown.`,
                },
                ...conversationHistory,
            ],
        });

        const response = completion.content;
        conversationHistory.push({ role: "assistant", content: response });
        displayMessage(response, 'assistant');

    } catch (error) {
        console.error("Error calling AI:", error);
        displayMessage("Sorry, I'm having trouble connecting to the AI. Please try again later.", 'assistant');
    }

    document.getElementById('user-input').value = '';
}

function displayMessage(message, sender) {
    const chatLog = document.getElementById('chat-log');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    // Convert markdown to HTML, preserving line breaks for paragraphs
    messageElement.innerHTML = marked.parse(message);
    
    // Add copy button
    if (sender === 'assistant') {
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.textContent = 'Copy';
        copyButton.onclick = function(event) {
            event.stopPropagation(); // Prevent triggering other events
            copyToClipboard(message);
        };
        messageElement.appendChild(copyButton);

        const downloadButton = document.createElement('button');
        downloadButton.classList.add('download-button');
        downloadButton.textContent = 'Download';
        downloadButton.onclick = function(event) {
            event.stopPropagation();
            downloadAsPDF(message, "ai_response.pdf");
        };
        messageElement.appendChild(downloadButton);
    }

    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight; // Scroll to bottom
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        alert('Text copied to clipboard!'); // Optional: Provide user feedback
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text. Please try again.');
    }
}

async function downloadAsPDF(text, filename) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const lines = text.split('\n');
    let y = 10;

    for (const line of lines) {
        const chunks = pdf.splitTextToSize(line, 180);

        for (const chunk of chunks) {
            pdf.text(chunk, 10, y);
            y += 7;
        }
    }
    pdf.save(filename);
}

function resetAI() {
    conversationHistory = [];
    const chatLog = document.getElementById('chat-log');
    chatLog.innerHTML = ''; // Clear chat log
    displayMessage("AI has been reset.", 'assistant');
}

function formatText(command) {
    document.execCommand(command, false, null);
}

function downloadEditedText() {
    const text = document.getElementById('editor').innerText;
    downloadAsPDF(text, "edited_response.pdf");
}

async function copyEditedText() {
    const text = document.getElementById('editor').innerText;
    copyToClipboard(text);
}

// Function to handle image upload
function addImageToEditor() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%'; // Make image fit the editor width
            document.getElementById('editor').appendChild(img);
        }

        reader.readAsDataURL(file); // Read the file as Data URL
    }
}