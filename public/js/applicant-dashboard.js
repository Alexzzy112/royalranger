const dashboardContent = document.getElementById('dashboard-content');
const logoutButton = document.getElementById('logout-button');

async function loadApplicantDetails() {
  const response = await fetch('/api/applicant/me');

  if (!response.ok) {
    dashboardContent.innerHTML = '<p>Your session is not active. Please <a href="applicant-login.html">login</a> again.</p>';
    return;
  }

  const json = await response.json();
  const applicant = json.member || json;

  dashboardContent.innerHTML = `
    <div class="profile-summary">
      ${applicant.photo_url ? `<img src="${applicant.photo_url}" alt="Profile Picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem;">` : ''}
      <h3>${applicant.full_name}</h3>
      <p><strong>Email:</strong> ${applicant.email}</p>
      <p><strong>Phone:</strong> ${applicant.contact}</p>
      <p><strong>Date of Birth:</strong> ${applicant.date_of_birth}</p>
      <p><strong>District:</strong> ${applicant.district}</p>
      <p><strong>Application ID:</strong> ${applicant.unique_id}</p>
      <p><strong>Status:</strong> ${applicant.status}</p>
      <p><strong>Unit:</strong> ${applicant.unit || 'N/A'}</p>
      <p><strong>Created:</strong> ${new Date(applicant.created_at).toLocaleDateString()}</p>
    </div>
  `;
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await fetch('/api/applicant/logout', { method: 'POST' });
    window.location.href = '/applicant-login.html';
  });
}

if (dashboardContent) {
  loadApplicantDetails();
}
