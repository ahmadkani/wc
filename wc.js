// src/InteractiveDashboardComponent.js
customElements.define('interactive-dashboard', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // Get attributes
        const title = this.getAttribute('title') || "Ahmad Dashboard";
        const data = JSON.parse(this.getAttribute('data') || '[]');

        // Initial rendering
        this.render(title, data);
        this.addEventListeners();
    }

    render(title, data) {
        this.shadowRoot.innerHTML = `
            <style>
                .dashboard {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    border: 2px solid #333;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .dashboard-header {
                    background: #6200ea;
                    color: #fff;
                    padding: 16px;
                    text-align: center;
                    font-size: 1.5em;
                }
                .dashboard-nav {
                    display: flex;
                    justify-content: space-around;
                    background: #f5f5f5;
                    border-bottom: 1px solid #ddd;
                }
                .dashboard-nav button {
                    flex: 1;
                    padding: 10px;
                    font-size: 1em;
                    border: none;
                    cursor: pointer;
                    background: #f5f5f5;
                    transition: background 0.2s;
                }
                .dashboard-nav button:hover {
                    background: #ddd;
                }
                .dashboard-content {
                    padding: 20px;
                }
                .dashboard-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .dashboard-table th, .dashboard-table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
            </style>
            <div class="dashboard">
                <div class="dashboard-header">${title}</div>
                <div class="dashboard-nav">
                    <button id="overview-tab">Overview</button>
                    <button id="details-tab">Details</button>
                </div>
                <div class="dashboard-content" id="dashboard-content">
                    <div id="overview" style="display: none;">
                        <h2>Overview</h2>
                        <p>Welcome to the dashboard. Click on the tabs to view different sections.</p>
                    </div>
                    <div id="details" style="display: none;">
                        <h2>User Details</h2>
                        ${this.generateTable(data)}
                    </div>
                </div>
            </div>
        `;
        this.showTab('overview');
    }

    addEventListeners() {
        this.shadowRoot.querySelector('#overview-tab').addEventListener('click', () => this.showTab('overview'));
        this.shadowRoot.querySelector('#details-tab').addEventListener('click', () => this.showTab('details'));
    }

    showTab(tabId) {
        const contentDiv = this.shadowRoot.getElementById('dashboard-content');
        contentDiv.querySelectorAll('div').forEach(div => div.style.display = 'none');
        contentDiv.querySelector(`#${tabId}`).style.display = 'block';
    }

    generateTable(data) {
        if (!Array.isArray(data) || data.length === 0) return "<p>No data available.</p>";
        const headers = Object.keys(data[0]);
        const rows = data.map(item => `<tr>${headers.map(key => `<td>${item[key]}</td>`).join('')}</tr>`).join('');
        return `
            <table class="dashboard-table">
                <thead>
                    <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }
});
