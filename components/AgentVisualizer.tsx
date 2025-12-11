import React from 'react';
import { AgentRole } from '../types';
import { AGENTS } from '../constants';

interface AgentVisualizerProps {
  activeAgent: AgentRole | null;
  isRouting: boolean;
  isGenerating: boolean;
}

const AgentVisualizer: React.FC<AgentVisualizerProps> = ({ activeAgent, isRouting, isGenerating }) => {
  const agentKeys = [
    AgentRole.PATIENT_MANAGEMENT,
    AgentRole.APPOINTMENTS,
    AgentRole.MEDICAL_RECORDS,
    AgentRole.BILLING_INSURANCE,
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🏥</span> RS INDUK Control Center
        </h2>
        <p className="text-sm text-gray-500 mt-1">Accounting Information System (AIS) Monitor</p>
      </div>

      {/* Orchestrator Status */}
      <div className={`mb-8 p-4 rounded-lg border-2 transition-all duration-300 ${isRouting ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRouting ? 'bg-blue-500 animate-ping' : 'bg-gray-400'}`}></div>
          <div className="font-semibold text-gray-700">Orchestrator Agent</div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {isRouting ? "Analyzing intent & routing request..." : "Idle - Waiting for input"}
        </div>
      </div>

      {/* Connection Lines (Visual Decoration) */}
      <div className="flex justify-center mb-2 -mt-4">
        <div className="w-0.5 h-6 bg-gray-300"></div>
      </div>
      <div className="flex justify-between px-8 mb-4">
         {/* Simple visual tree structure lines */}
         <div className="w-full border-t-2 border-gray-200 relative top-0"></div>
      </div>

      {/* Sub Agents Grid */}
      <div className="grid grid-cols-2 gap-4 flex-grow content-start">
        {agentKeys.map((key) => {
          const agent = AGENTS[key as AgentRole];
          const isActive = activeAgent === key;
          const isWorking = isActive && isGenerating;

          return (
            <div 
              key={key}
              className={`
                relative p-4 rounded-lg border transition-all duration-500
                ${isActive 
                  ? `${agent.color} text-white shadow-xl scale-105 border-transparent` 
                  : 'bg-white border-gray-200 text-gray-400 opacity-60 grayscale'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{agent.icon}</span>
                {isWorking && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
              </div>
              <h3 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-600'}`}>
                {agent.name}
              </h3>
              <p className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                {agent.description}
              </p>
              
              {isActive && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  ACTIVE
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AIS Special Note */}
      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
          AIS Auditor Note
        </h4>
        <p className="text-xs text-amber-700 leading-relaxed">
          Sistem ini merekam jejak perutean untuk audit kepatuhan. Agen Penagihan (Billing) dikonfigurasi dengan ketelitian tinggi untuk integritas data keuangan.
        </p>
      </div>
    </div>
  );
};

export default AgentVisualizer;