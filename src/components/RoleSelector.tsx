import React from 'react';
import { Briefcase, Code, Users, Palette, BarChart3, Settings } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  disabled?: boolean;
}

const ROLES = [
  {
    id: 'Software Engineer',
    name: 'Software Engineer',
    icon: Code,
    description: 'Technical problem-solving, system design, coding practices',
    focus: 'Logic, technical communication, problem breakdown'
  },
  {
    id: 'Data Analyst',
    name: 'Data Analyst',
    icon: BarChart3,
    description: 'Data interpretation, analytical thinking, insights',
    focus: 'Metrics, data storytelling, statistical reasoning'
  },
  {
    id: 'Product Manager',
    name: 'Product Manager',
    icon: Settings,
    description: 'Strategy, stakeholder management, decision-making',
    focus: 'Strategic thinking, prioritization, user focus'
  },
  {
    id: 'Project Manager',
    name: 'Project Manager',
    icon: Users,
    description: 'Team leadership, process optimization, delivery',
    focus: 'Organization, communication, risk management'
  },
  {
    id: 'Product Designer',
    name: 'Product Designer',
    icon: Palette,
    description: 'User experience, design thinking, creativity',
    focus: 'User empathy, design process, problem solving'
  },
  {
    id: 'General',
    name: 'General Interview',
    icon: Briefcase,
    description: 'Universal interview skills and communication',
    focus: 'Overall communication, professionalism, confidence'
  }
];

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleChange, disabled = false }) => {
  const selectedRoleData = ROLES.find(role => role.id === selectedRole) || ROLES[0];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Role
        </label>
        <select
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ROLES.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {/* Role Information Card */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <selectedRoleData.icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">{selectedRoleData.name}</h4>
            <p className="text-sm text-blue-700 mb-2">{selectedRoleData.description}</p>
            <div className="bg-blue-100 rounded px-3 py-2">
              <p className="text-xs text-blue-800">
                <strong>Analysis Focus:</strong> {selectedRoleData.focus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;