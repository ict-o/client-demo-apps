import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { Estimate } from './types';
import { sampleEstimateList, initialEstimate } from './data/sampleData';
import { Layout } from './components/Layout';
import { EstimateList } from './pages/EstimateList';
import { EstimateWizard } from './pages/EstimateWizard';
import { EstimateEdit } from './pages/EstimateEdit';
import { EstimatePreview } from './pages/EstimatePreview';
import { BVManager } from './pages/BVManager';

const BASE = '/client-demo-apps/bridal-estimate-demo';

export default function App() {
  const [estimates, setEstimates] = useState<Estimate[]>(sampleEstimateList);
  const [selectedId, setSelectedId] = useState<string>(initialEstimate.id);

  const selectedEstimate = estimates.find(e => e.id === selectedId) ?? estimates[0];

  function handleEstimateChange(updated: Estimate) {
    setEstimates(prev =>
      prev.some(e => e.id === updated.id)
        ? prev.map(e => e.id === updated.id ? updated : e)
        : [updated, ...prev]
    );
    setSelectedId(updated.id);
  }

  function handleCreated(est: Estimate) {
    setEstimates(prev => [est, ...prev]);
    setSelectedId(est.id);
  }

  return (
    <BrowserRouter basename={BASE}>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <EstimateList
                estimates={estimates}
                onSelect={setSelectedId}
              />
            }
          />
          <Route
            path="/new"
            element={<EstimateWizard onCreated={handleCreated} />}
          />
          <Route
            path="/edit"
            element={
              <EstimateEdit
                estimate={selectedEstimate}
                onChange={handleEstimateChange}
              />
            }
          />
          <Route
            path="/preview"
            element={<EstimatePreview estimate={selectedEstimate} />}
          />
          <Route
            path="/bv"
            element={<BVManager estimate={selectedEstimate} />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
