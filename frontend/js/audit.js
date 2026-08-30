// ============================================
// HISTORY / AUDIT MODULE
// ============================================

async function loadAudit() {
    console.log('📜 Loading audit...');
    const list = document.getElementById('auditList');
    if (!list) return;
    
    try {
        const response = await fetch(API_URL + '/audit');
        const audits = await response.json();
        displayAudit(audits);
    } catch (error) {
        list.innerHTML = '<p class="error">❌ Failed to load audit</p>';
    }
}

function displayAudit(audits) {
    const list = document.getElementById('auditList');
    if (!list) return;
    
    if (!audits || audits.length === 0) {
        list.innerHTML = '<p class="no-data">📭 No audit records found</p>';
        return;
    }

    let html = '<div style="font-size: 0.9rem;">';
    
    audits.forEach(function(audit) {
        const date = new Date(audit.changed_at);
        const formattedDate = date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        let actionColor = '#28a745';
        let actionIcon = '➕';
        let actionLabel = 'CREATE';
        if (audit.action === 'UPDATE') {
            actionColor = '#ffc107';
            actionIcon = '✏️';
            actionLabel = 'UPDATE';
        } else if (audit.action === 'DELETE') {
            actionColor = '#dc3545';
            actionIcon = '🗑️';
            actionLabel = 'DELETE';
        }
        
        html += '<div style="background: #f8f9fa; padding: 12px 15px; margin: 8px 0; border-radius: 8px; border-left: 4px solid ' + actionColor + ';">';
        html += '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">';
        html += '<div>';
        html += '<span style="font-weight: bold; color: ' + actionColor + ';">' + actionIcon + ' ' + actionLabel + '</span>';
        html += '<span style="color: #666; margin-left: 10px;">ID: ' + audit.entry_id + '</span>';
        html += '</div>';
        html += '<span style="color: #999; font-size: 0.8rem;">' + formattedDate + '</span>';
        html += '</div>';
        html += '<div style="margin-top: 5px; font-size: 0.9rem; color: #333;">';
        if (audit.action === 'CREATE') {
            html += '<span>💰 Amount: <strong>' + formatCurrency(audit.new_amount) + '</strong></span>';
            if (audit.new_description) {
                html += '<span style="margin-left: 15px;">📝 ' + audit.new_description + '</span>';
            }
        } else if (audit.action === 'UPDATE') {
            html += '<span>💰 Old: <strong style="color: #dc3545;">' + formatCurrency(audit.old_amount) + '</strong> → New: <strong style="color: #28a745;">' + formatCurrency(audit.new_amount) + '</strong></span>';
        } else if (audit.action === 'DELETE') {
            html += '<span>💰 Amount: <strong style="color: #dc3545;">' + formatCurrency(audit.old_amount) + '</strong> (DELETED)</span>';
        }
        html += '</div>';
        html += '</div>';
    });
    
    html += '</div>';
    list.innerHTML = html;
}