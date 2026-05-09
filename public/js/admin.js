const membersContainer = document.getElementById('members-container');
const feedbackContainer = document.getElementById('feedback-container');
const refreshButton = document.getElementById('refresh-members');
const approveAllBtn = document.getElementById('approve-all-btn');
const refreshFeedbackBtn = document.getElementById('refresh-feedback');

async function fetchMembers() {
  membersContainer.innerHTML = '<p style="color:var(--muted);">Loading members...</p>';
  const response = await fetch('/api/members');
  if (!response.ok) {
    membersContainer.innerHTML = '<p style="color:#ff8a65;">Unable to load members.</p>';
    return;
  }
  const members = await response.json();
  renderMembers(members);
}

function renderMembers(members) {
  if (!members.length) {
    membersContainer.innerHTML = '<p style="color:var(--muted);">No registered members yet.</p>';
    return;
  }

  membersContainer.innerHTML = members.map(member => `
    <div class="card" style="padding:1.5rem;">
      <div style="display:grid; grid-template-columns:120px 1fr; gap:1.5rem;">
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <img src="${member.photo_url}" alt="Passport" style="width:100%; border-radius:12px; object-fit:cover;">
        </div>
        <div>
          <h3>${member.full_name}</h3>
          <p><strong>ID:</strong> ${member.unique_id}</p>
          <p><strong>Rank:</strong> ${member.rank}</p>
          <p><strong>District:</strong> ${member.district}</p>
          <p><strong>Unit:</strong> ${member.unit}</p>
          <p><strong>Status:</strong> ${member.status}</p>
          <p><strong>Contact:</strong> ${member.contact}</p>
          <p><strong>DOB:</strong> ${member.date_of_birth}</p>
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:1rem;">
            <button class="button" onclick="updateStatus('${member._id}', 'approved')" style="font-size:0.85rem;">Approve</button>
            <button class="button" style="background:#555;color:#fff; font-size:0.85rem;" onclick="updateStatus('${member._id}', 'rejected')">Reject</button>
            <button class="button" style="background:#222;color:#fff; font-size:0.85rem;" onclick="removeMember('${member._id}')">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function updateStatus(id, status) {
  const response = await fetch(`/api/members/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (response.ok) {
    fetchMembers();
  } else {
    alert('Unable to update status.');
  }
}

async function removeMember(id) {
  if (!confirm('Delete this member record?')) return;
  const response = await fetch(`/api/members/${id}`, { method: 'DELETE' });
  if (response.ok) {
    fetchMembers();
  } else {
    alert('Unable to delete member.');
  }
}

async function approveAllPending() {
  if (!confirm('Approve all pending members?')) return;
  const response = await fetch('/api/members/approve-all/pending', { method: 'POST' });
  if (response.ok) {
    const result = await response.json();
    alert(result.message);
    fetchMembers();
  } else {
    alert('Unable to approve all members.');
  }
}

async function fetchFeedback() {
  feedbackContainer.innerHTML = '<p style="color:var(--muted);">Loading feedback...</p>';
  const response = await fetch('/api/feedback');
  if (!response.ok) {
    feedbackContainer.innerHTML = '<p style="color:#ff8a65;">Unable to load feedback.</p>';
    return;
  }
  const feedbacks = await response.json();
  renderFeedback(feedbacks);
}

function renderFeedback(feedbacks) {
  if (!feedbacks.length) {
    feedbackContainer.innerHTML = '<p style="color:var(--muted);">No feedback submitted yet.</p>';
    return;
  }

  feedbackContainer.innerHTML = feedbacks.map(fb => `
    <div class="card" style="padding:1.5rem;">
      <h3>${fb.subject}</h3>
      <p><strong>From:</strong> ${fb.full_name} (${fb.email})</p>
      <p><strong>Message:</strong></p>
      <p>${fb.message}</p>
      <p><strong>Status:</strong> ${fb.status}</p>
      ${fb.admin_response ? `<p><strong>Response:</strong> ${fb.admin_response}</p>` : ''}
      <div style="margin-top:1rem; display:flex; gap:0.75rem; flex-wrap:wrap; align-items:flex-start;">
          <textarea id="response-${fb._id}" placeholder="Type your response here..." style="flex:1 1 100%; border-radius:12px; padding:0.75rem; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:var(--text); min-height:100px;"></textarea>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button class="button" onclick="respondToFeedback('${fb._id}')" style="margin-top:0.75rem;">Send Response</button>
          <button class="button" onclick="deleteFeedback('${fb._id}')" style="margin-top:0.75rem; background:#d32f2f; color:#fff;">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function respondToFeedback(id) {
  const responseText = document.getElementById(`response-${id}`).value;
  if (!responseText.trim()) {
    alert('Please type a response.');
    return;
  }
  const response = await fetch(`/api/feedback/${id}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_response: responseText, status: 'responded' })
  });
  if (response.ok) {
    fetchFeedback();
  } else {
    alert('Unable to send response.');
  }
}

async function deleteFeedback(id) {
  if (!confirm('Delete this feedback or complaint record?')) return;
  const response = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
  if (response.ok) {
    fetchFeedback();
  } else {
    alert('Unable to delete feedback.');
  }
}

refreshButton.addEventListener('click', fetchMembers);
approveAllBtn.addEventListener('click', approveAllPending);
refreshFeedbackBtn.addEventListener('click', fetchFeedback);

fetchMembers();
fetchFeedback();
