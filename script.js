document.addEventListener('DOMContentLoaded', () => {
    // Navigation Tabs Logic
    const navButtons = document.querySelectorAll('.nav-btn');
    const panels = document.querySelectorAll('.panel');

    navButtons.forEach((button) => {
        button.addEventListener('click', () => {
            navButtons.forEach((btn) => btn.classList.remove('active'));
            panels.forEach((panel) => panel.classList.remove('active'));

            button.classList.add('active');
            const target = document.getElementById(button.dataset.target);
            if (target) target.classList.add('active');
        });
    });

    // AI Doctor Elements
    const aiDoctorBtn = document.getElementById('aiDoctorBtn');
    const assistantBtn = document.getElementById('assistantBtn');
    const doctorPanel = document.getElementById('doctorPanel');
    const cropImageInput = document.getElementById('cropImageInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const doctorInput = document.getElementById('doctorInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const doctorResponse = document.getElementById('doctorResponse');
    const responseContent = document.getElementById('responseContent');
    const suggestionButtons = document.querySelectorAll('.doctor-suggestions button');

    let uploadedFile = null;

    // Toggle AI Doctor Panel
    function toggleDoctorPanel() {
        if (doctorPanel) {
            doctorPanel.classList.toggle('open');
            if (doctorPanel.classList.contains('open')) {
                doctorPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    if (aiDoctorBtn) aiDoctorBtn.addEventListener('click', toggleDoctorPanel);
    if (assistantBtn) assistantBtn.addEventListener('click', toggleDoctorPanel);

    // Image Upload & Preview Logic
    if (cropImageInput) {
        cropImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadedFile = file;
                const reader = new FileReader();
                reader.onload = (event) => {
                    imagePreview.src = event.target.result;
                    imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            uploadedFile = null;
            cropImageInput.value = '';
            imagePreview.src = '';
            imagePreviewContainer.style.display = 'none';
        });
    }

    // Quick Suggestion Pill Buttons
    suggestionButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            doctorInput.value = btn.dataset.query || btn.innerText;
        });
    });

    // Diagnosis Trigger Logic
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const textQuery = doctorInput.value.trim();

            if (!uploadedFile && !textQuery) {
                alert('Please upload a plant leaf photo or type your crop symptom query.');
                return;
            }

            doctorResponse.style.display = 'block';
            responseContent.innerHTML = '<em>⏳ Analyzing image and crop health... Please wait.</em>';

            try {
                // If backend API endpoint is active (Next.js/Express)
                const formData = new FormData();
                if (uploadedFile) formData.append('image', uploadedFile);
                if (textQuery) formData.append('query', textQuery);

                const res = await fetch('/api/crop-doctor', {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    responseContent.innerHTML = data.result || 'Diagnosis completed.';
                } else {
                    // Client-side fallback preview response
                    setTimeout(() => {
                        let resultText = `<strong>Sample Identified:</strong> ${uploadedFile ? 'Crop Leaf Sample' : 'User Query'}<br/>`;
                        resultText += `<strong>Diagnosis:</strong> ${textQuery || 'Visual Leaf Inspection'}<br/>`;
                        resultText += `<strong>Action Steps:</strong><br/>
                        1. Ensure proper root drainage.<br/>
                        2. Apply organic neem oil spray in case of pest symptoms.<br/>
                        3. Irrigate in early mornings to reduce water stress.`;
                        responseContent.innerHTML = resultText;
                    }, 1000);
                }
            } catch (err) {
                // Fallback simulation when running locally as pure static HTML
                setTimeout(() => {
                    let resultText = `<strong>Sample Analyzed:</strong> ${uploadedFile ? uploadedFile.name : 'Query'}<br/>`;
                    resultText += `<strong>Recommendation:</strong> Inspect leaf undersides, balance nitrogen fertilization, and maintain moderate soil moisture.`;
                    responseContent.innerHTML = resultText;
                }, 800);
            }
        });
    }
});