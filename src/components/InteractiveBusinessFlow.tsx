/**
 * @fileoverview InteractiveBusinessFlow.tsx — Premium fulfillment lifecycle graph
 * Designed following react-flow-architect and react-flow-node-ts patterns:
 * - Hierarchical processing navigation (nodes + edges structure).
 * - Stable, memoized component leaf nodes (memo + useCallback props preservation).
 * - Pure SVG animated connector edges.
 * - Responsive, non-overflow layout (horizontal flex-row on desktop, vertical flex-col on mobile).
 * - Strict type checking using defined TS models.
 */

import React, { useState, memo, useCallback, useMemo } from 'react';
import { ShieldCheck, CreditCard, Box, Truck, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { StageNodeData } from '../types/index.ts';

const STAGE_DETAILS: Record<string, StageNodeData> = {
  received: {
    title: '1. Order Received',
    icon: ShieldCheck,
    color: '#FBBF24',
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    description: 'Customer checks out their cart. The payload is automatically verified against schema validation.js and mapped to MongoDB.',
    metricName: 'Pending',
    processTime: 'Instant (~50ms)',
    system: 'Mongoose / Express API',
  },
  payment: {
    title: '2. Payment Verified',
    icon: CreditCard,
    color: '#3B82F6',
    bg: 'bg-blue-50 border-blue-200 text-blue-700',
    description: 'COD confirmation is recorded or digital payment channels are verified. The transaction log is written securely.',
    metricName: 'Processing',
    processTime: '< 2 Hours',
    system: 'Stripe / Bank Networks',
  },
  picking: {
    title: '3. Inventory Allocated',
    icon: Box,
    color: '#8B5CF6',
    bg: 'bg-purple-50 border-purple-200 text-purple-700',
    description: 'Warehouse picks stock. Quantities are decremented from individual size/color maps with automatic delta logging.',
    metricName: 'Processing',
    processTime: '4 - 12 Hours',
    system: 'AdminInventory / MongoDB',
  },
  shipping: {
    title: '4. Dispatched',
    icon: Truck,
    color: '#EC4899',
    bg: 'bg-pink-50 border-pink-200 text-pink-700',
    description: 'Handed over to courier. An unique ORD Tracking SKU is generated and SMS/Email tracking updates trigger.',
    metricName: 'Shipped',
    processTime: '12 - 24 Hours',
    system: 'Logistic Service API',
  },
  complete: {
    title: '5. Completed',
    icon: CheckCircle,
    color: '#22C55E',
    bg: 'bg-green-50 border-green-200 text-green-700',
    description: 'Delivered securely. Order status updates to Delivered. Customer feedback channels open on product pages.',
    metricName: 'Delivered',
    processTime: '2 - 3 Days',
    system: 'AdminReviews / Customer Accounts',
  },
};

// ─────────────────────────────────────────────────────────────────
// MEMOIZED STAGE NODE RENDERER
// ─────────────────────────────────────────────────────────────────
interface StageNodeProps {
  stageKey: string;
  config: StageNodeData;
  isActive: boolean;
  onClick: (stageKey: string) => void;
  liveCount: number;
}

const StageNode = memo(({ stageKey, config, isActive, onClick, liveCount }: StageNodeProps) => {
  const Icon = config.icon;

  return (
    <button
      onClick={() => onClick(stageKey)}
      className={`w-full md:w-48 p-5 border text-left rounded-[4px] transition-all duration-300 relative group outline-none ${
        isActive
          ? 'bg-gray-900 border-gray-900 text-white'
          : 'bg-white border-gray-100 text-gray-800 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center border transition-colors ${
          isActive
            ? 'bg-white/10 border-white/20 text-white'
            : `${config.bg} border-current/20`
        }`}>
          <Icon size={16} />
        </div>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-[4px] ${
          isActive
            ? 'bg-cardinal text-white'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {liveCount} Items
        </span>
      </div>

      <h4 className="text-xs font-black uppercase tracking-tight mb-1">{config.title.split('. ')[1]}</h4>
      <p className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
        {config.metricName} status
      </p>

      {/* Dynamic select indicator bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-b-[4px] transition-all duration-300 ${
        isActive ? 'bg-cardinal scale-x-100' : 'bg-transparent scale-x-0'
      }`} />
    </button>
  );
});

StageNode.displayName = 'StageNode';

// ─────────────────────────────────────────────────────────────────
// MAIN GRAPH LIFECYCLE COMPONENT
// ─────────────────────────────────────────────────────────────────
interface InteractiveBusinessFlowProps {
  ordersByStatus: Record<string, number>;
}

export const InteractiveBusinessFlow = memo(({ ordersByStatus = {} }: InteractiveBusinessFlowProps) => {
  const [activeStage, setActiveStage] = useState<string>('received');

  const handleStageSelect = useCallback((key: string) => {
    setActiveStage(key);
  }, []);

  const liveCounts = useMemo<Record<string, number>>(() => {
    return {
      received: ordersByStatus.Pending ?? 0,
      payment: ordersByStatus.Processing ?? 0,
      picking: ordersByStatus.Processing ?? 0, // share same status but different workflow steps
      shipping: ordersByStatus.Shipped ?? 0,
      complete: ordersByStatus.Delivered ?? 0,
    };
  }, [ordersByStatus]);

  const activeDetails = useMemo<StageNodeData>(() => {
    return STAGE_DETAILS[activeStage];
  }, [activeStage]);

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6 sm:p-8 shadow-sm">
      <div className="flex items-center space-x-2 mb-2">
        <Sparkles size={14} className="text-cardinal" />
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">System Flow</p>
      </div>
      <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-8">
        Fulfillment Lifecycle Graph
      </h3>

      {/* Node Grid Layout — adaptive direction prevent horizontal overflow */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 relative mb-10">
        
        {/* Stage Node 1 */}
        <StageNode
          stageKey="received"
          config={STAGE_DETAILS.received}
          isActive={activeStage === 'received'}
          onClick={handleStageSelect}
          liveCount={liveCounts.received}
        />

        <ArrowRight className="hidden md:block text-gray-300 flex-shrink-0 animate-pulse" size={14} />

        {/* Stage Node 2 */}
        <StageNode
          stageKey="payment"
          config={STAGE_DETAILS.payment}
          isActive={activeStage === 'payment'}
          onClick={handleStageSelect}
          liveCount={liveCounts.payment}
        />

        <ArrowRight className="hidden md:block text-gray-300 flex-shrink-0 animate-pulse" size={14} />

        {/* Stage Node 3 */}
        <StageNode
          stageKey="picking"
          config={STAGE_DETAILS.picking}
          isActive={activeStage === 'picking'}
          onClick={handleStageSelect}
          liveCount={liveCounts.picking}
        />

        <ArrowRight className="hidden md:block text-gray-300 flex-shrink-0 animate-pulse" size={14} />

        {/* Stage Node 4 */}
        <StageNode
          stageKey="shipping"
          config={STAGE_DETAILS.shipping}
          isActive={activeStage === 'shipping'}
          onClick={handleStageSelect}
          liveCount={liveCounts.shipping}
        />

        <ArrowRight className="hidden md:block text-gray-300 flex-shrink-0 animate-pulse" size={14} />

        {/* Stage Node 5 */}
        <StageNode
          stageKey="complete"
          config={STAGE_DETAILS.complete}
          isActive={activeStage === 'complete'}
          onClick={handleStageSelect}
          liveCount={liveCounts.complete}
        />
      </div>

      {/* Selected Node Details Card — custom detail render */}
      <div className="p-6 bg-gray-50 rounded-[4px] border border-gray-100 animate-fade-in relative overflow-hidden">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
              {activeDetails.title}
            </h4>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Processing Standard Operations
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Avg Duration</p>
              <p className="text-xs font-black text-gray-900">{activeDetails.processTime}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Core Engine</p>
              <p className="text-xs font-black text-cardinal">{activeDetails.system}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 font-medium leading-relaxed">
          {activeDetails.description}
        </p>
      </div>
    </div>
  );
});

InteractiveBusinessFlow.displayName = 'InteractiveBusinessFlow';
export default InteractiveBusinessFlow;
