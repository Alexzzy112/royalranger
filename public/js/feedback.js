const feedbackForm = document.getElementById('feedback-form');
const feedbackMessage = document.getElementById('feedback-message');

if (feedbackForm) {
  feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedbackMessage.textContent = '';

    const formData = new FormData(feedbackForm);
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
      })
    });

    if (!response.ok) {
      const payload = await response.json();
      feedbackMessage.textContent = payload.error || 'Feedback submission failed. Please try again.';
      return;
    }

    feedbackMessage.textContent = 'Thank you! Your feedback has been submitted.';
    feedbackForm.reset();
  });
}
