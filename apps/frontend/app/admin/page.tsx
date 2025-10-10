'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('nodes');
  const [nodes, setNodes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [ipPools, setIpPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      switch (activeTab) {
        case 'nodes':
          const nodesData = await api.get('/nodes');
          setNodes(nodesData.data);
          break;
        case 'templates':
          const templatesData = await api.get('/templates');
          setTemplates(templatesData.data);
          break;
        case 'plans':
          const plansData = await api.get('/plans');
          setPlans(plansData.data);
          break;
        case 'ippools':
          const ipPoolsData = await api.get('/ipam/pools');
          setIpPools(ipPoolsData.data);
          break;
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">VPS Panel Admin</h1>
              <a href="/dashboard" className="text-sm text-gray-700 hover:text-gray-900">
                User Dashboard
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Admin: {user?.name}</span>
              <button onClick={handleLogout} className="text-sm text-gray-700 hover:text-gray-900">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { key: 'nodes', label: 'Nodes' },
                { key: 'templates', label: 'Templates' },
                { key: 'plans', label: 'Plans' },
                { key: 'ippools', label: 'IP Pools' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mt-6">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <>
                {activeTab === 'nodes' && <NodesTab nodes={nodes} onRefresh={loadData} />}
                {activeTab === 'templates' && <TemplatesTab templates={templates} onRefresh={loadData} />}
                {activeTab === 'plans' && <PlansTab plans={plans} onRefresh={loadData} />}
                {activeTab === 'ippools' && <IpPoolsTab ipPools={ipPools} onRefresh={loadData} />}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NodesTab({ nodes, onRefresh }: { nodes: any[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Proxmox Nodes</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Node
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {nodes.map((node) => (
            <li key={node.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{node.name}</h3>
                  <p className="text-sm text-gray-500">
                    {node.host}:{node.port}
                  </p>
                  <p className="text-sm text-gray-500">Storage: {node.storage || 'N/A'}</p>
                </div>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    node.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {node.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showModal && (
        <AddNodeModal onClose={() => setShowModal(false)} onAdded={() => { setShowModal(false); onRefresh(); }} />
      )}
    </div>
  );
}

function TemplatesTab({ templates, onRefresh }: { templates: any[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">VM Templates</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Template
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">{template.name}</h3>
            <p className="text-sm text-gray-500 mb-1">VM ID: {template.vmid}</p>
            <p className="text-sm text-gray-500 mb-1">Node: {template.nodeName}</p>
            <p className="text-sm text-gray-500 mb-1">OS: {template.osType}</p>
            {template.description && <p className="text-sm text-gray-600 mt-2">{template.description}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <AddTemplateModal onClose={() => setShowModal(false)} onAdded={() => { setShowModal(false); onRefresh(); }} />
      )}
    </div>
  );
}

function PlansTab({ plans, onRefresh }: { plans: any[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Resource Plans</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white overflow-hidden shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">{plan.name}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>CPU: {plan.cpu} cores</p>
              <p>Memory: {plan.memory} MB</p>
              <p>Disk: {plan.disk} GB</p>
              <p>Snapshots: {plan.snapshotQuota}</p>
            </div>
            {plan.description && <p className="text-sm text-gray-500 mt-2">{plan.description}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <AddPlanModal onClose={() => setShowModal(false)} onAdded={() => { setShowModal(false); onRefresh(); }} />
      )}
    </div>
  );
}

function IpPoolsTab({ ipPools, onRefresh }: { ipPools: any[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">IP Pools</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add IP Pool
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {ipPools.map((pool) => (
            <li key={pool.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{pool.name}</h3>
                  <p className="text-sm text-gray-500">Subnet: {pool.subnet}</p>
                  <p className="text-sm text-gray-500">Gateway: {pool.gateway}</p>
                  <p className="text-sm text-gray-500">
                    Addresses: {pool.addresses?.length || 0}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      pool.isPrivate ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {pool.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showModal && (
        <AddIpPoolModal onClose={() => setShowModal(false)} onAdded={() => { setShowModal(false); onRefresh(); }} />
      )}
    </div>
  );
}

// Modal components
function AddNodeModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 8006,
    username: 'root@pam',
    password: '',
    storage: 'local-lvm',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/nodes', formData);
      onAdded();
    } catch (err) {
      alert('Failed to add node');
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <h3 className="text-lg font-medium mb-4">Add Proxmox Node</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Node Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Host"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Port"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Storage"
              value={formData.storage}
              onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex space-x-3">
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add Node
              </button>
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddTemplateModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    vmid: 0,
    nodeName: '',
    osType: 'linux',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/templates', formData);
      onAdded();
    } catch (err) {
      alert('Failed to add template');
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <h3 className="text-lg font-medium mb-4">Add Template</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="VM ID"
              value={formData.vmid}
              onChange={(e) => setFormData({ ...formData, vmid: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Node Name"
              value={formData.nodeName}
              onChange={(e) => setFormData({ ...formData, nodeName: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <select
              value={formData.osType}
              onChange={(e) => setFormData({ ...formData, osType: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="linux">Linux</option>
              <option value="windows">Windows</option>
            </select>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
            <div className="flex space-x-3">
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add Template
              </button>
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddPlanModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    cpu: 1,
    memory: 1024,
    disk: 20,
    snapshotQuota: 3,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/plans', formData);
      onAdded();
    } catch (err) {
      alert('Failed to add plan');
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <h3 className="text-lg font-medium mb-4">Add Plan</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Plan Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="CPU Cores"
              value={formData.cpu}
              onChange={(e) => setFormData({ ...formData, cpu: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Memory (MB)"
              value={formData.memory}
              onChange={(e) => setFormData({ ...formData, memory: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Disk (GB)"
              value={formData.disk}
              onChange={(e) => setFormData({ ...formData, disk: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Snapshot Quota"
              value={formData.snapshotQuota}
              onChange={(e) => setFormData({ ...formData, snapshotQuota: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
            <div className="flex space-x-3">
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add Plan
              </button>
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddIpPoolModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    subnet: '',
    gateway: '',
    isPrivate: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/ipam/pools', formData);
      onAdded();
    } catch (err) {
      alert('Failed to add IP pool');
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <h3 className="text-lg font-medium mb-4">Add IP Pool</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Pool Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Subnet (CIDR, e.g., 10.0.0.0/24)"
              value={formData.subnet}
              onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Gateway"
              value={formData.gateway}
              onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="mr-2"
              />
              <span>Private Pool</span>
            </label>
            <div className="flex space-x-3">
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add IP Pool
              </button>
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
