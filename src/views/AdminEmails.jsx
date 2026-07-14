import React, { useState, useEffect } from 'react';
import { Table, Tabs, Card, Tag, Button, Input, Form, Select, Modal, Space, Message, Tooltip } from 'antd';
import { Mail, Search, RefreshCw, AlertTriangle, Eye, ShieldAlert, UserCheck, Plus, Trash2 } from 'lucide-react';
import { authFetch } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';

const { TabPane } = Tabs;

export default function AdminEmails() {
  const [activeTab, setActiveTab] = useState('outbox');
  
  // Outbox state
  const [outboxItems, setOutboxItems] = useState([]);
  const [outboxLoading, setOutboxLoading] = useState(false);
  const [outboxTotal, setOutboxTotal] = useState(0);
  const [outboxPage, setOutboxPage] = useState(1);
  const [outboxStatus, setOutboxStatus] = useState('all');
  const [searchKey, setSearchKey] = useState('');

  // Suppression state
  const [suppressedItems, setSuppressedItems] = useState([]);
  const [suppressedLoading, setSuppressedLoading] = useState(false);
  const [suppressedTotal, setSuppressedTotal] = useState(0);
  const [suppressedPage, setSuppressedPage] = useState(1);
  const [addSuppressionVisible, setAddSuppressionVisible] = useState(false);
  const [form] = Form.useForm();

  // Preview state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState('order-confirmed-customer');
  const [previewIdempotencyKey, setPreviewIdempotencyKey] = useState('');

  // Fetch Outbox Items
  const fetchOutbox = async () => {
    setOutboxLoading(true);
    try {
      const url = `/api/v1/admin/emails?type=outbox&status=${outboxStatus}&page=${outboxPage}&limit=10${searchKey ? `&idempotencyKey=${searchKey}` : ''}`;
      const res = await authFetch(apiUrl(url));
      if (res && res.items) {
        setOutboxItems(res.items);
        setOutboxTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch outbox:', err.message);
    } finally {
      setOutboxLoading(false);
    }
  };

  // Fetch Suppression list
  const fetchSuppression = async () => {
    setSuppressedLoading(true);
    try {
      const url = `/api/v1/admin/emails?type=suppression&page=${suppressedPage}&limit=10`;
      const res = await authFetch(apiUrl(url));
      if (res && res.items) {
        setSuppressedItems(res.items);
        setSuppressedTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch suppression list:', err.message);
    } finally {
      setSuppressedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'outbox') {
      fetchOutbox();
    } else if (activeTab === 'suppression') {
      fetchSuppression();
    }
  }, [activeTab, outboxPage, outboxStatus, suppressedPage]);

  const handleSearch = () => {
    setOutboxPage(1);
    fetchOutbox();
  };

  const handleResend = async (idempotencyKey) => {
    try {
      const res = await authFetch(apiUrl('/api/v1/admin/emails'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', idempotencyKey }),
      });
      if (res && res.success) {
        // antd simple message fallback
        alert('Email status reset to pending successfully!');
        fetchOutbox();
      }
    } catch (err) {
      alert(`Failed to resend: ${err.message}`);
    }
  };

  const handleSuppress = async (values) => {
    try {
      const res = await authFetch(apiUrl('/api/v1/admin/emails'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suppress', email: values.email, reason: values.reason }),
      });
      if (res && res.success) {
        alert(`${values.email} successfully suppressed.`);
        setAddSuppressionVisible(false);
        form.resetFields();
        fetchSuppression();
      }
    } catch (err) {
      alert(`Failed to suppress: ${err.message}`);
    }
  };

  const handleUnsuppress = async (email) => {
    try {
      const res = await authFetch(apiUrl('/api/v1/admin/emails'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsuppress', email }),
      });
      if (res && res.success) {
        alert(`${email} successfully unsuppressed.`);
        fetchSuppression();
      }
    } catch (err) {
      alert(`Failed to unsuppress: ${err.message}`);
    }
  };

  const showPreview = (template, idempotencyKey = '') => {
    setPreviewTemplate(template);
    setPreviewIdempotencyKey(idempotencyKey);
    setPreviewVisible(true);
  };

  const statusColors = {
    pending: 'blue',
    sent: 'green',
    failed: 'orange',
    dlq: 'red',
  };

  const outboxColumns = [
    {
      title: 'Idempotency Key',
      dataIndex: 'idempotencyKey',
      key: 'idempotencyKey',
      render: (text) => <span className="font-mono text-xs font-bold text-gray-900">{text}</span>,
    },
    {
      title: 'Template',
      dataIndex: 'template',
      key: 'template',
      render: (text) => <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{text}</span>,
    },
    {
      title: 'Recipient',
      dataIndex: 'to',
      key: 'to',
      render: (text) => <span className="font-bold text-gray-700">{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'} className="font-black uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-[2px]">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Attempts',
      dataIndex: 'attempts',
      key: 'attempts',
      align: 'center',
      render: (attempts) => <span className="font-bold">{attempts}</span>,
    },
    {
      title: 'Next Attempt',
      dataIndex: 'nextAttemptAt',
      key: 'nextAttemptAt',
      render: (date) => <span className="text-xs text-gray-500">{new Date(date).toLocaleString('en-PK')}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Eye size={14} className="text-gray-500" />}
            onClick={() => showPreview(record.template, record.idempotencyKey)}
            title="Preview Email"
            className="hover:bg-gray-100"
          />
          {record.status === 'dlq' || record.status === 'failed' ? (
            <Button
              type="text"
              icon={<RefreshCw size={14} className="text-cardinal" />}
              onClick={() => handleResend(record.idempotencyKey)}
              title="Retry Sending"
              className="hover:bg-red-50"
            />
          ) : null}
        </Space>
      ),
    },
  ];

  const suppressionColumns = [
    {
      title: 'Suppressed Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <span className="font-bold text-gray-900">{text}</span>,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => (
        <Tag color={text === 'manual' ? 'default' : 'orange'} className="font-black uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-[2px]">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Suppressed At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className="text-xs text-gray-500">{new Date(date).toLocaleString('en-PK')}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<Trash2 size={14} />}
          onClick={() => handleUnsuppress(record.email)}
          title="Remove from Suppression"
          className="hover:bg-red-50"
        />
      ),
    },
  ];

  const templatesList = [
    'order-confirmed-customer',
    'order-confirmed-admin',
    'order-paid-customer',
    'order-paid-admin',
    'order-shipped-customer',
    'order-shipped-admin',
    'order-delivered-customer',
    'order-delivered-admin',
    'order-cancelled-customer',
    'order-cancelled-admin',
    'order-payment-failed-customer',
    'order-payment-failed-admin',
    'order-refunded-customer',
    'order-refunded-admin',
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Email Manager</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Order Lifecycle Emails &amp; Suppressions</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'suppression' && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => setAddSuppressionVisible(true)}
              className="bg-gray-900 hover:bg-black text-white border-0 font-black uppercase text-[10px] tracking-widest h-9 rounded-[2px]"
            >
              Add Suppression
            </Button>
          )}
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-[2px] overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-admin-tabs px-6 pt-4"
          tabBarStyle={{ marginBottom: 0 }}
        >
          <TabPane
            tab={
              <span className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider">
                <Mail size={14} /> Outbox Queue
              </span>
            }
            key="outbox"
          />
          <TabPane
            tab={
              <span className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider">
                <ShieldAlert size={14} /> Suppression List
              </span>
            }
            key="suppression"
          />
          <TabPane
            tab={
              <span className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider">
                <Eye size={14} /> Template Previews
              </span>
            }
            key="previews"
          />
        </Tabs>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'outbox' && (
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-1 max-w-md border-b-2 border-gray-200 focus-within:border-gray-900 transition-colors">
                  <Search size={16} className="text-gray-400 self-center mr-2" />
                  <Input
                    placeholder="Search by Idempotency Key..."
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    onPressEnter={handleSearch}
                    bordered={false}
                    className="w-full py-2 pl-0 text-gray-900 font-bold text-sm outline-none"
                  />
                  {searchKey && (
                    <Button type="text" size="small" onClick={() => { setSearchKey(''); setTimeout(fetchOutbox, 50); }} className="text-xs uppercase font-bold text-gray-400 self-center">
                      Clear
                    </Button>
                  )}
                </div>

                <div className="flex gap-4">
                  <Select
                    value={outboxStatus}
                    onChange={(val) => { setOutboxStatus(val); setOutboxPage(1); }}
                    className="w-40 custom-antd-select font-bold text-xs uppercase"
                    bordered={false}
                    style={{ borderBottom: '2px solid #e5e7eb' }}
                  >
                    <Select.Option value="all">ALL STATUSES</Select.Option>
                    <Select.Option value="pending">PENDING</Select.Option>
                    <Select.Option value="sent">SENT</Select.Option>
                    <Select.Option value="failed">FAILED</Select.Option>
                    <Select.Option value="dlq">DLQ (DEAD LETTER)</Select.Option>
                  </Select>
                  <Button
                    onClick={fetchOutbox}
                    icon={<RefreshCw size={14} />}
                    className="border border-gray-200 hover:border-gray-900 hover:text-gray-900 font-black text-xs uppercase h-10 rounded-[2px]"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              <Table
                columns={outboxColumns}
                dataSource={outboxItems}
                loading={outboxLoading}
                rowKey="idempotencyKey"
                pagination={{
                  current: outboxPage,
                  pageSize: 10,
                  total: outboxTotal,
                  onChange: setOutboxPage,
                  showSizeChanger: false,
                }}
                className="custom-admin-table"
              />
            </div>
          )}

          {activeTab === 'suppression' && (
            <div className="space-y-6">
              <Table
                columns={suppressionColumns}
                dataSource={suppressedItems}
                loading={suppressedLoading}
                rowKey="email"
                pagination={{
                  current: suppressedPage,
                  pageSize: 10,
                  total: suppressedTotal,
                  onChange: setSuppressedPage,
                  showSizeChanger: false,
                }}
                className="custom-admin-table"
              />
            </div>
          )}

          {activeTab === 'previews' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Sidebar Template List */}
              <div className="md:col-span-1 border-r border-gray-100 pr-4 space-y-1">
                <span style={{ display: 'block', fontSize: '9px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#737373', marginBottom: '12px' }}>
                  Select Template
                </span>
                {templatesList.map(template => (
                  <button
                    key={template}
                    onClick={() => setPreviewTemplate(template)}
                    className={`w-full text-left px-3 py-2.5 rounded-[2px] text-xs font-bold transition-all uppercase tracking-wider ${
                      previewTemplate === template
                        ? 'bg-gray-900 text-white font-black'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {template.replace('order-', '')}
                  </button>
                ))}
              </div>

              {/* Live Preview Display */}
              <div className="md:col-span-3 flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase">{previewTemplate}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Rendered Preview with Mock Data</p>
                  </div>
                  <Button
                    type="text"
                    icon={<RefreshCw size={14} />}
                    onClick={() => {
                      const iframe = document.getElementById('template-preview-iframe');
                      if (iframe) iframe.contentWindow?.location.reload();
                    }}
                    className="hover:bg-gray-100"
                  />
                </div>
                <div className="border border-gray-200 rounded-[2px] bg-gray-50 overflow-hidden shadow-inner h-[600px]">
                  <iframe
                    id="template-preview-iframe"
                    src={`/api/v1/admin/emails?type=preview&template=${previewTemplate}`}
                    className="w-full h-full border-0"
                    title="Live Template Preview"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Preview Modal for specific outbox items */}
      <Modal
        title={
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase">Email Preview</h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Idempotency Key: {previewIdempotencyKey}</p>
          </div>
        }
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={700}
        bodyStyle={{ padding: '20px 0 0' }}
        className="custom-admin-modal"
      >
        <div className="border-t border-gray-200 h-[500px]">
          <iframe
            src={`/api/v1/admin/emails?type=preview&template=${previewTemplate}&idempotencyKey=${previewIdempotencyKey}`}
            className="w-full h-full border-0"
            title="Outbox Email Preview"
          />
        </div>
      </Modal>

      {/* Add Suppression Modal */}
      <Modal
        title={
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase">Add Email Suppression</h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Manually suppress recipient address</p>
          </div>
        }
        visible={addSuppressionVisible}
        onCancel={() => setAddSuppressionVisible(false)}
        footer={null}
        className="custom-admin-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSuppress}
          className="space-y-4 pt-4"
        >
          <Form.Item
            name="email"
            label={<span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Email Address</span>}
            rules={[{ required: true, message: 'Please enter the email address' }, { type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input className="border-2 border-gray-200 focus:border-gray-900 h-10 rounded-[2px]" />
          </Form.Item>

          <Form.Item
            name="reason"
            label={<span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Suppression Reason</span>}
            initialValue="manual"
          >
            <Select className="custom-antd-select h-10 border-2 border-gray-200 focus:border-gray-900 rounded-[2px]">
              <Select.Option value="manual">MANUAL SUPPRESSION</Select.Option>
              <Select.Option value="bounce">BOUNCED ADDRESS</Select.Option>
              <Select.Option value="spam_complaint">SPAM COMPLAINT</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button onClick={() => setAddSuppressionVisible(false)} className="font-black uppercase text-[10px] tracking-wider rounded-[2px] h-9">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="bg-gray-900 hover:bg-black text-white border-0 font-black uppercase text-[10px] tracking-wider rounded-[2px] h-9">
              Add Suppression
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
