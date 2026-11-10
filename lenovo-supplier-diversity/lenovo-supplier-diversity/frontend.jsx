import React, { useState, useEffect } from 'react';
import axios from 'axios';
import lenovoLogo from './Lenovo Logo.png';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' }
});

// ============ COLOR PALETTE ============
const COLORS = {
  lenvoRed: '#E81828',
  lenovoPurple: '#7A126B',
  darkGrey: '#ABA8B1',
  mediumGrey: '#ABA8B1',
  lightGrey: '#ABA8B1',
  white: '#FFFFFF'
};

// ============ CATEGORY DEFINITIONS ============
const CATEGORIES = {
  MBE: {
    label: "MBE (Minority-Owned)",
    description: "A profit enterprise regardless of size that is operated, managed and controlled by minority individuals. The business must be at least 51% owned by Minority individuals or in case of publicly owned business at least 51% of stock is owned by individuals that identify as racial minority."
  },
  WBE: {
    label: "WBE (Women-Owned)",
    description: "A profit enterprise regardless of size that is operated, managed and controlled by women. The business must be at least 51% owned by women or in case of publicly owned business at least 51% of stock is owned by one or more women."
  },
  LGBT: {
    label: "LGBT (LGBT-Owned)",
    description: "A profit enterprise regardless of size that is operated, managed and controlled by LGBT individuals. The business must be at least 51% owned by LGBT individuals."
  },
  VET: {
    label: "VET (Veteran-Owned)",
    description: "A profit enterprise regardless of size that is operated, managed and controlled by military veterans. The business must be at least 51% owned by veterans."
  },
  Disabled: {
    label: "Disabled (Disabled-Owned)",
    description: "A profit enterprise regardless of size that is operated, managed and controlled by individuals with disabilities. The business must be at least 51% owned by individuals with disabilities."
  },
  DBE: {
    label: "DBE (Disadvantaged)",
    description: "A profit enterprise that is at least 51% owned and controlled by socially and economically disadvantaged individuals as defined by the U.S. Small Business Administration."
  },
  SDV: {
    label: "Service Disabled Veteran",
    description: "A business at least 51% owned and controlled by one or more service-disabled veterans."
  },
  SmallBusiness: {
    label: "Small Business",
    description: "A small business that meets the applicable size standards for its industry."
  }
};

// ============ STYLES ============
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.lightGrey,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  navbar: {
    backgroundColor: COLORS.darkGrey,
    color: COLORS.white,
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  },
  logo: {
    display: 'inline-block',
    height: '42px',
    width: 'auto',
    verticalAlign: 'middle'
  },
  navSubtitle: {
    fontSize: '0.9rem',
    color: COLORS.lenovoPurple,
    fontWeight: 'bold',
    marginLeft: '0.5rem',
    verticalAlign: 'middle'
  },
  logoutBtn: {
    backgroundColor: COLORS.lenvoRed,
    color: COLORS.white,
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  card: {
    backgroundColor: COLORS.white,
    borderLeft: `5px solid ${COLORS.lenvoRed}`,
    padding: '2rem',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem'
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: COLORS.darkGrey,
    marginBottom: '1.5rem',
    borderBottom: `2px solid ${COLORS.lenovoPurple}`,
    paddingBottom: '0.5rem'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: COLORS.darkGrey,
    fontSize: '0.95rem'
  },
  input: {
    width: '100%',
    padding: '0.8rem',
    border: `1px solid ${COLORS.mediumGrey}`,
    borderRadius: '4px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  inputFocus: {
    borderColor: COLORS.lenvoRed,
    outline: 'none'
  },
  button: {
    backgroundColor: COLORS.lenvoRed,
    color: COLORS.white,
    border: 'none',
    padding: '0.8rem 1.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    transition: 'background-color 0.3s'
  },
  buttonSecondary: {
    backgroundColor: COLORS.lenovoPurple,
    color: COLORS.white,
    border: 'none',
    padding: '0.8rem 1.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem'
  },
  tableHeader: {
    backgroundColor: COLORS.lenovoPurple,
    color: COLORS.white,
    padding: '1rem',
    textAlign: 'left',
    fontWeight: 'bold'
  },
  tableRow: {
    borderBottom: `1px solid ${COLORS.mediumGrey}`
  },
  tableCell: {
    padding: '1rem',
    textAlign: 'left'
  },
  badge: {
    display: 'inline-block',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: 'bold'
  },
  badgeVerified: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  badgePending: {
    backgroundColor: '#fff3cd',
    color: '#856404'
  },
  authContainer: {
    maxWidth: '400px',
    margin: '3rem auto',
    padding: '2rem',
    backgroundColor: COLORS.white,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    textAlign: 'center'
  },
  authSubtitle: {
    color: COLORS.lenovoPurple,
    marginBottom: '2rem',
    fontSize: '0.95rem',
    fontWeight: 'bold'
  },
  toggle: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem'
  },
  toggleBtn: {
    flex: 1,
    padding: '0.8rem',
    border: `2px solid ${COLORS.mediumGrey}`,
    backgroundColor: COLORS.white,
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: 'bold',
    color: COLORS.darkGrey,
    transition: 'all 0.3s'
  },
  toggleBtnActive: {
    backgroundColor: COLORS.lenvoRed,
    color: COLORS.white,
    borderColor: COLORS.lenvoRed
  },
  infoIcon: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    backgroundColor: COLORS.lenovoPurple,
    color: COLORS.white,
    borderRadius: '50%',
    textAlign: 'center',
    lineHeight: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginLeft: '0.5rem',
    cursor: 'pointer',
    position: 'relative'
  },
  tooltip: {
    position: 'absolute',
    bottom: '125%',
    left: '-100px',
    width: '250px',
    backgroundColor: COLORS.darkGrey,
    color: COLORS.white,
    padding: '0.8rem',
    borderRadius: '4px',
    fontSize: '0.85rem',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    lineHeight: '1.4'
  },
  tooltipArrow: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: `6px solid ${COLORS.darkGrey}`
  }
};

// ============ HELPER COMPONENT ============
function InfoIcon({ description }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      style={styles.infoIcon}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
      title="Click for more info"
    >
      ℹ
      {showTooltip && (
        <div style={styles.tooltip}>
          {description}
          <div style={styles.tooltipArrow}></div>
        </div>
      )}
    </span>
  );
}

// ============ COMPONENTS ============

// LOGIN PAGE
function LoginPage({ onLoginSuccess }) {
  const [isAdmin, setIsAdmin] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdmin && isRegister) {
        const res = await API.post('/admin/register', { email, password });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('userId', res.data.user_id);
        onLoginSuccess(res.data.role);
      } else {
        const endpoint = isAdmin ? '/admin/login' : '/supplier/login';
        const res = await API.post(endpoint, { email, password });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('userId', res.data.user_id);
        onLoginSuccess(res.data.role);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div>
          <img src={lenovoLogo} alt="Lenovo" style={styles.logo} />
          <span style={styles.navSubtitle}>Supplier Inclusion</span>
        </div>
      </div>

      <div style={styles.authContainer}>
        <img src={lenovoLogo} alt="Lenovo" style={{ ...styles.logo, display: 'block', height: '48px', margin: '0 auto 0.5rem' }} />
        <p style={styles.authSubtitle}>Supplier Inclusion Platform</p>

        <div style={styles.toggle}>
          <button
            style={{
              ...styles.toggleBtn,
              ...(isAdmin ? styles.toggleBtnActive : {})
            }}
            onClick={() => {
              setIsAdmin(true);
              setIsRegister(false);
            }}
          >
            Admin
          </button>
          <button
            style={{
              ...styles.toggleBtn,
              ...(!isAdmin ? styles.toggleBtnActive : {})
            }}
            onClick={() => {
              setIsAdmin(false);
              setIsRegister(false);
            }}
          >
            Supplier
          </button>
        </div>

        {isAdmin && (
          <div style={styles.toggle}>
            <button
              style={{
                ...styles.toggleBtn,
                ...(isRegister ? styles.toggleBtnActive : {})
              }}
              onClick={() => setIsRegister(true)}
            >
              Register
            </button>
            <button
              style={{
                ...styles.toggleBtn,
                ...(!isRegister ? styles.toggleBtnActive : {})
              }}
              onClick={() => setIsRegister(false)}
            >
              Login
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={!isAdmin ? "supplier@lenovo.com" : ""}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={!isAdmin ? "Lenovo123" : ""}
              required
            />
            {!isAdmin && (
              <p style={{ fontSize: '0.85rem', color: COLORS.mediumGrey, marginTop: '0.5rem' }}>
                💡 Universal login: supplier@lenovo.com / Lenovo123
              </p>
            )}
          </div>

          {error && <p style={{ color: COLORS.lenvoRed, marginBottom: '1rem' }}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Loading...' : (isAdmin && isRegister) ? 'Create Admin Account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ADMIN DASHBOARD
function AdminDashboard({ onLogout }) {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/admin/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(res.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const inviteSupplier = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await API.post(`/admin/suppliers/invite?email=${newSupplierEmail}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const link = `http://localhost:3000${res.data.verification_link}`;
      alert(`Invitation sent!\n\nShare this link with supplier:\n\n${link}\n\nThey can copy-paste it in their browser.`);
      setNewSupplierEmail('');
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Invitation failed');
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await API.post('/admin/export-excel', {}, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'supplier_submissions.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      let message = err.response?.data?.detail || 'Export failed';
      if (err.response?.data instanceof Blob) {
        try {
          const responseText = await err.response.data.text();
          message = JSON.parse(responseText).detail || message;
        } catch {
          // Keep the fallback message when the response is not JSON.
        }
      }
      alert(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div>
          <img src={lenovoLogo} alt="Lenovo" style={styles.logo} />
          <span style={styles.navSubtitle}>Supplier Inclusion - Admin</span>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>

      <div style={styles.mainContent}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            style={{
              ...styles.buttonSecondary,
              backgroundColor: activeTab === 'suppliers' ? COLORS.lenvoRed : COLORS.lenovoPurple
            }}
            onClick={() => setActiveTab('suppliers')}
          >
            Suppliers
          </button>
          <button
            style={{
              ...styles.buttonSecondary,
              backgroundColor: activeTab === 'submissions' ? COLORS.lenvoRed : COLORS.lenovoPurple
            }}
            onClick={() => setActiveTab('submissions')}
          >
            Submissions
          </button>
        </div>

        {activeTab === 'suppliers' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Manage Suppliers</h2>

            <form onSubmit={inviteSupplier}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Invite New Supplier</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="supplier@company.com"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  required
                />
              </div>
              <button style={styles.button} type="submit">Send Invitation</button>
            </form>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: COLORS.darkGrey }}>
              All Suppliers
            </h3>
            {loading ? (
              <p>Loading...</p>
            ) : suppliers.length === 0 ? (
              <p style={{ color: COLORS.mediumGrey }}>No suppliers yet.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Supplier Name</th>
                    <th style={styles.tableHeader}>Email</th>
                    <th style={styles.tableHeader}>Status</th>
                    <th style={styles.tableHeader}>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{s.name || 'Pending'}</td>
                      <td style={styles.tableCell}>{s.email}</td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.badge,
                          ...(s.is_verified ? styles.badgeVerified : styles.badgePending)
                        }}>
                          {s.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Supplier Submissions</h2>
            <button style={styles.button} onClick={exportExcel} disabled={exporting}>
              {exporting ? 'Preparing Excel...' : 'Download All Submissions (Excel)'}
            </button>
            <p style={{ marginTop: '1rem', color: COLORS.darkGrey }}>
              Click to download all supplier submissions as an Excel file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// SUPPLIER FORM
function SupplierForm({ onLogout }) {
  const [supplier, setSupplier] = useState(null);
  const [totalSales, setTotalSales] = useState('');
  const [salesToCustomer, setSalesToCustomer] = useState('');
  const [noActivity, setNoActivity] = useState(false);
  const [formData, setFormData] = useState({
    period: '',
    region: '',
    tier: 'Tier 2',
    business_email: '',
    tax_id: '',
    customer_name: '',
    comments: '',
    suppliers: [
      { name: 'MBE', allocation_percent: 0, allocated_spend: 0 },
      { name: 'WBE', allocation_percent: 0, allocated_spend: 0 },
      { name: 'LGBT', allocation_percent: 0, allocated_spend: 0 },
      { name: 'VET', allocation_percent: 0, allocated_spend: 0 },
      { name: 'Disabled', allocation_percent: 0, allocated_spend: 0 },
      { name: 'DBE', allocation_percent: 0, allocated_spend: 0 },
      { name: 'SDV', allocation_percent: 0, allocated_spend: 0 },
      { name: 'SmallBusiness', allocation_percent: 0, allocated_spend: 0 }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchSupplierProfile();
  }, []);

  const fetchSupplierProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/supplier/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupplier(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate allocation percentage
  const calculateAllocation = async () => {
    if (noActivity) return;
    if (totalSales && salesToCustomer) {
      try {
        const res = await API.post('/calculate-allocation', {
          total_sales: parseFloat(totalSales),
          sales_to_customer: parseFloat(salesToCustomer)
        });
        
        // Update all supplier rows with calculated allocation
        const updated = formData.suppliers.map(s => ({
          ...s,
          allocation_percent: res.data.allocation_percent
        }));
        setFormData({ ...formData, suppliers: updated });
      } catch (err) {
        console.error('Calculation error:', err);
      }
    }
  };

  // Call calculate whenever totals change
  useEffect(() => {
    calculateAllocation();
  }, [totalSales, salesToCustomer, noActivity]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSupplierChange = (index, field, value) => {
    const updated = [...formData.suppliers];
    updated[index][field] = value;
    setFormData({ ...formData, suppliers: updated });
  };


  const submitForm = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.customer_name.trim()) {
      alert('Please enter your Company Name');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await API.post('/supplier/submit-form', {
        ...formData,
        is_edit: isEdit,
        no_activity: noActivity,
        total_sales: Number(totalSales) || 0,
        sales_to_customer: Number(salesToCustomer) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✓ Form submitted successfully!');
      // Reset form
      setTotalSales('');
      setSalesToCustomer('');
      setNoActivity(false);
      setIsEdit(false);
      setFormData({
        period: '',
        region: '',
        tier: 'Tier 2',
        business_email: '',
        tax_id: '',
        customer_name: '',
        comments: '',
        suppliers: [
          { name: 'MBE', allocation_percent: 0, allocated_spend: 0 },
          { name: 'WBE', allocation_percent: 0, allocated_spend: 0 },
          { name: 'LGBT', allocation_percent: 0, allocated_spend: 0 },
          { name: 'VET', allocation_percent: 0, allocated_spend: 0 },
          { name: 'Disabled', allocation_percent: 0, allocated_spend: 0 },
          { name: 'DBE', allocation_percent: 0, allocated_spend: 0 },
          { name: 'SDV', allocation_percent: 0, allocated_spend: 0 },
          { name: 'SmallBusiness', allocation_percent: 0, allocated_spend: 0 }
        ]
      });
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Submission failed';
      alert(`❌ Error: ${errorMsg}`);
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div>
          <img src={lenovoLogo} alt="Lenovo" style={styles.logo} />
          <span style={styles.navSubtitle}>Supplier Inclusion</span>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Supplier Information Form</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Need help completing the standardized Tier 2 form?{' '}
            <a
              href="/How%20to%20Submit%20Standardized%20Tier%202%20Form.docx"
              download="How to Submit Standardized Tier 2 Form.docx"
            >
              Download the instructions
            </a>
            .
          </p>

          <form onSubmit={submitForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Is this an edit to your previous data input?</label>
              <select
                style={styles.input}
                value={isEdit ? 'yes' : 'no'}
                onChange={(e) => setIsEdit(e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              {isEdit && (
                <p style={{ color: COLORS.darkGrey, marginBottom: 0 }}>
                  We will find your previous submission by period, region, business email, and tax ID and replace it with this data.
                </p>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Period</label>
              <select
                style={styles.input}
                name="period"
                value={formData.period}
                onChange={handleFormChange}
                required
              >
                <option value="">-- Select a Quarter --</option>
                <option value="Jan - Mar 2026">Jan - Mar 2026</option>
                <option value="Apr - Jun 2026">Apr - Jun 2026</option>
                <option value="Jul - Sep 2026">Jul - Sep 2026</option>
                <option value="Oct - Dec 2026">Oct - Dec 2026</option>
                <option value="Jan - Mar 2027">Jan - Mar 2027</option>
                <option value="Apr - Jun 2027">Apr - Jun 2027</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Region</label>
              <select
                style={styles.input}
                name="region"
                value={formData.region}
                onChange={handleFormChange}
                required
              >
                <option value="">-- Select a Region --</option>
                <option value="NA">NA</option>
                <option value="EMEA">EMEA</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Business Email</label>
              <input
                style={styles.input}
                type="email"
                name="business_email"
                value={formData.business_email}
                onChange={handleFormChange}
                placeholder="name@company.com"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tax ID</label>
              <input
                style={styles.input}
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleFormChange}
                placeholder="Enter tax ID"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Company Name</label>
              <input
                style={styles.input}
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleFormChange}
                placeholder="Enter your company name"
                required
              />
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: COLORS.darkGrey }}>
              Allocation Calculation
            </h3>

            <label style={{ ...styles.label, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={noActivity}
                onChange={(e) => setNoActivity(e.target.checked)}
                style={{ marginTop: '0.35rem' }}
              />
              <strong>No reported spend or revenue activity from customer during this quarter</strong>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Total Sales to all Customers This Period ($)</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="e.g., 1000000"
                  value={noActivity ? 0 : totalSales}
                  disabled={noActivity}
                  onChange={(e) => setTotalSales(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Sales to Lenovo ($)</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="e.g., 60000"
                  value={noActivity ? 0 : salesToCustomer}
                  disabled={noActivity}
                  onChange={(e) => setSalesToCustomer(e.target.value)}
                />
              </div>
            </div>

            {!noActivity && totalSales && salesToCustomer && (
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem',
                color: '#155724'
              }}>
                <strong>✓ Auto-calculated Allocation %:</strong> {formData.suppliers[0]?.allocation_percent || 0}%
              </div>
            )}

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: COLORS.darkGrey }}>
              Tier 2 Supplier Data
            </h3>

            <table className="supplier-data-table" style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Category</th>
                  <th style={styles.tableHeader}>Total Category Spend ($ USD)</th>
                  <th style={styles.tableHeader}>Allocation %</th>
                  <th style={styles.tableHeader}>= Total</th>
                </tr>
              </thead>
              <tbody>
                {formData.suppliers.map((s, idx) => (
                  <tr key={idx} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold' }}>{CATEGORIES[s.name]?.label || s.name}</span>
                        {CATEGORIES[s.name] && (
                          <InfoIcon description={CATEGORIES[s.name].description} />
                        )}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <input
                        style={{ ...styles.input, padding: '0.5rem' }}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={noActivity ? 0 : s.allocated_spend}
                        disabled={noActivity}
                        onChange={(e) => handleSupplierChange(idx, 'allocated_spend', Number(e.target.value) || 0)}
                      />
                    </td>
                    <td style={styles.tableCell}>
                      <input
                        style={{ ...styles.input, padding: '0.5rem' }}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={noActivity ? 0 : s.allocation_percent}
                        readOnly
                      />
                    </td>
                    <td style={styles.tableCell}>
                      <input
                        style={{ ...styles.input, padding: '0.5rem', backgroundColor: COLORS.lightGrey }}
                        type="number"
                        step="0.01"
                        placeholder="Total"
                        value={noActivity ? '0.00' : ((s.allocated_spend || 0) * (s.allocation_percent || 0) / 100).toFixed(2)}
                        readOnly
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '1.5rem', backgroundColor: COLORS.lightGrey, padding: '1rem', borderRadius: '4px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: COLORS.darkGrey }}>
                Please share your recent efforts to support supplier inclusion for this quarter
              </h3>
              <label style={styles.label}>Comments</label>
              <textarea
                style={{
                  ...styles.input,
                  minHeight: '80px',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                  resize: 'vertical'
                }}
                value={formData.comments || ''}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
              />
            </div>

            <button style={styles.button} type="submit" disabled={submitting}>
              {submitting ? (isEdit ? 'Updating...' : 'Submitting...') : (isEdit ? 'Update Previous Submission' : 'Submit Form')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// VERIFICATION PAGE
function VerificationPage() {
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      verifyEmail(token);
    }
  }, []);

  const verifyEmail = async (token) => {
    try {
      await API.post(`/supplier/verify?token=${token}`);
      setVerified(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div>
          <img src={lenovoLogo} alt="Lenovo" style={styles.logo} />
          <span style={styles.navSubtitle}>Supplier Inclusion</span>
        </div>
      </div>

      <div style={styles.authContainer}>
        {loading ? (
          <p>Verifying email...</p>
        ) : verified ? (
          <>
            <h2 style={{ color: COLORS.lenvoRed, marginBottom: '1rem' }}>✓ Email Verified!</h2>
            <p style={{ color: COLORS.darkGrey, marginBottom: '2rem' }}>
              Your email has been verified. You can now log in.
            </p>
            <a href="/" style={{
              ...styles.button,
              display: 'inline-block',
              textDecoration: 'none'
            }}>
              Go to Login
            </a>
          </>
        ) : (
          <>
            <h2 style={{ color: COLORS.lenvoRed, marginBottom: '1rem' }}>✗ Verification Failed</h2>
            <p style={{ color: COLORS.darkGrey }}>{error}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [role, setRole] = useState(localStorage.getItem('role'));

  const handleLoginSuccess = (userRole) => {
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setRole(null);
  };

  // Check if we're on verification page
  if (window.location.pathname === '/verify') {
    return <VerificationPage />;
  }

  // Route based on login state
  if (!role) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (role === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (role === 'supplier') {
    return <SupplierForm onLogout={handleLogout} />;
  }

  return <div>Unknown role</div>;
}
