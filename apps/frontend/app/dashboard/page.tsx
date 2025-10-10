'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { vmsAPI, templatesAPI, plansAPI } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vms, setVms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vmsData, templatesData, plansData] = await Promise.all([
        vmsAPI.list(),
        templatesAPI.list(),
        plansAPI.list(),
      ]);
      setVms(vmsData);
      setTemplates(templatesData);
      setPlans(plansData);
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

  const handleVmAction = async (action: string, vmId: string) => {
    try {
      switch (action) {
        case 'start':
          await vmsAPI.start(vmId);
          break;
        case 'stop':
          await vmsAPI.stop(vmId);
          break;
        case 'reboot':
          await vmsAPI.reboot(vmId);
          break;
        case 'reinstall':
          if (confirm('Are you sure you want to reinstall this VM? All data will be lost.')) {
            await vmsAPI.reinstall(vmId);
          }
          break;
      }
      loadData();
    } catch (err) {
      console.error('VM action failed:', err);
      alert('Action failed. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'creating':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">VPS Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Virtual Machines</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create VM
            </button>
          </div>

          {vms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No VMs yet. Create your first VM to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vms.map((vm) => (
                <div key={vm.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{vm.name}</h3>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          vm.status
                        )}`}
                      >
                        {vm.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1 mb-4">
                      <p>IP: {vm.ipAddress?.address || 'Allocating...'}</p>
                      <p>Template: {vm.template?.name}</p>
                      <p>
                        Resources: {vm.plan?.cpu} CPU / {vm.plan?.memory}MB RAM / {vm.plan?.disk}GB
                        Disk
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {vm.status === 'stopped' && (
                        <button
                          onClick={() => handleVmAction('start', vm.id)}
                          className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Start
                        </button>
                      )}
                      {vm.status === 'running' && (
                        <>
                          <button
                            onClick={() => handleVmAction('stop', vm.id)}
                            className="flex-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Stop
                          </button>
                          <button
                            onClick={() => handleVmAction('reboot', vm.id)}
                            className="flex-1 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                          >
                            Reboot
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleVmAction('reinstall', vm.id)}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Reinstall
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateVmModal
          templates={templates}
          plans={plans}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CreateVmModal({
  templates,
  plans,
  onClose,
  onCreated,
}: {
  templates: any[];
  plans: any[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [planId, setPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await vmsAPI.create({ name, templateId, planId });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create VM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create New VM</h3>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                VM Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                Template
              </label>
              <select
                id="template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                Plan
              </label>
              <select
                id="plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.cpu} CPU / {plan.memory}MB RAM / {plan.disk}GB Disk
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create VM'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
