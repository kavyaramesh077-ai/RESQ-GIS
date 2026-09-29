import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  Database,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Upload,
  Sliders,
  TrendingUp,
  Activity,
  FileText,
  Download,
  Check,
  Sparkles,
  Zap,
  Info,
  ArrowRight,
  ShieldCheck,
  Pause
} from 'lucide-react';
import {
  TrainingDataset,
  TrainingHyperparameters,
  TrainingEpochRecord,
  TrainedModelSession,
  ActiveTrainedWeights
} from '../types';
import {
  BENCHMARK_TRAINING_DATASETS,
  SUPPORTED_MODEL_ARCHITECTURES,
  ModelArchitectureMeta
} from '../data/trainingDatasets';
import {
  runDatasetTraining,
  getActiveModelWeights,
  setActiveModelWeights,
  resetToDefaultWeights,
  parseCustomCsvDataset,
  DEFAULT_ACTIVE_WEIGHTS
} from '../services/mlTrainingEngine';

interface ModelTrainingStudioPageProps {
  onNavigateToAnalyzer: () => void;
}

export const ModelTrainingStudioPage: React.FC<ModelTrainingStudioPageProps> = ({
  onNavigateToAnalyzer
}) => {
  // Model Architecture Selection
  const [selectedArch, setSelectedArch] = useState<ModelArchitectureMeta>(SUPPORTED_MODEL_ARCHITECTURES[0]);

  // Dataset Selection
  const [datasets, setDatasets] = useState<TrainingDataset[]>(BENCHMARK_TRAINING_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(BENCHMARK_TRAINING_DATASETS[0].id);
  const [isCustomUploadOpen, setIsCustomUploadOpen] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hyperparameters
  const [epochs, setEpochs] = useState<number>(20);
  const [learningRate, setLearningRate] = useState<number>(0.005);
  const [batchSize, setBatchSize] = useState<number>(32);
  const [optimizer, setOptimizer] = useState<'adam' | 'sgd' | 'rmsprop'>('adam');
  const [validationSplit, setValidationSplit] = useState<number>(0.2);
  const [l2Regularization, setL2Regularization] = useState<number>(0.001);

  // Training Execution State
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [history, setHistory] = useState<TrainingEpochRecord[]>([]);
  const [completedSession, setCompletedSession] = useState<TrainedModelSession | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [activeWeights, setActiveWeights] = useState<ActiveTrainedWeights>(getActiveModelWeights());
  const [deploySuccessBanner, setDeploySuccessBanner] = useState<string | null>(null);

  const cancelTrainingRef = useRef<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId) || datasets[0];

  // Auto-scroll terminal logs during training
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs]);

  // Handle Architecture change
  const handleSelectArchitecture = (arch: ModelArchitectureMeta) => {
    setSelectedArch(arch);
    setEpochs(arch.defaultEpochs);
    setLearningRate(arch.defaultLearningRate);
    setBatchSize(arch.defaultBatchSize);

    // Auto-select recommended dataset if available
    const rec = datasets.find(d => d.id === arch.recommendedDatasetId);
    if (rec) {
      setSelectedDatasetId(rec.id);
    }
  };

  // Run Training
  const handleStartTraining = async () => {
    setIsTraining(true);
    setHistory([]);
    setCurrentEpoch(0);
    setCompletedSession(null);
    setDeploySuccessBanner(null);
    cancelTrainingRef.current = false;

    const initialLogs = [
      `[INIT] Initializing computational graph for ${selectedArch.name}...`,
      `[DATA] Ingesting "${selectedDataset.name}" (${selectedDataset.recordCount.toLocaleString()} samples, ${selectedDataset.features.length} features)...`,
      `[OPTIM] Configured ${optimizer.toUpperCase()} optimizer: learning_rate=${learningRate}, batch_size=${batchSize}, val_split=${validationSplit * 100}%...`,
      `[START] Commencing forward-backward propagation over ${epochs} epochs...`
    ];
    setLiveLogs(initialLogs);

    const hyperparams: TrainingHyperparameters = {
      epochs,
      learningRate,
      batchSize,
      optimizer,
      lossFunction: 'binary_crossentropy',
      validationSplit,
      l2Regularization
    };

    try {
      const session = await runDatasetTraining(
        selectedDataset,
        selectedArch,
        hyperparams,
        (epochRecord) => {
          setCurrentEpoch(epochRecord.epoch);
          setHistory(prev => [...prev, epochRecord]);
          setLiveLogs(prev => [
            ...prev,
            `[Epoch ${String(epochRecord.epoch).padStart(2, '0')}/${epochs}] loss: ${epochRecord.trainLoss.toFixed(4)} - val_loss: ${epochRecord.valLoss.toFixed(4)} - val_acc: ${(epochRecord.valAccuracy * 100).toFixed(1)}% - f1: ${epochRecord.f1Score.toFixed(3)} - rocAuc: ${epochRecord.rocAuc.toFixed(3)}`
          ]);
        },
        () => cancelTrainingRef.current
      );

      setCompletedSession(session);
      setLiveLogs(prev => [
        ...prev,
        `[COMPLETE] Training converged successfully at Epoch ${session.currentEpoch}.`,
        `[EVAL] Final Validation F1: ${(session.finalMetrics?.f1Score || 0).toFixed(3)} | ROC-AUC: ${(session.finalMetrics?.rocAuc || 0).toFixed(3)} | Accuracy: ${((session.finalMetrics?.valAccuracy || 0) * 100).toFixed(1)}%`,
        `[READY] New weights serialized and ready for deployment to AI Risk Analyzer.`
      ]);
    } catch (err: any) {
      setLiveLogs(prev => [...prev, `[ERROR] Training interrupted: ${err.message || err}`]);
    } finally {
      setIsTraining(false);
    }
  };

  const handleStopTraining = () => {
    cancelTrainingRef.current = true;
    setIsTraining(false);
    setLiveLogs(prev => [...prev, `[CANCELLED] Training stopped by user directive.`]);
  };

  // Deploy newly trained model to live app
  const handleDeployModel = () => {
    if (!completedSession) return;
    setActiveModelWeights(completedSession.learnedWeights);
    setActiveWeights(completedSession.learnedWeights);
    setDeploySuccessBanner(
      `Active Model Successfully Updated: "${completedSession.learnedWeights.modelName}" is now the primary inference engine in AI Risk Analyzer!`
    );
  };

  // Reset to default weights
  const handleResetWeights = () => {
    const def = resetToDefaultWeights();
    setActiveWeights(def);
    setDeploySuccessBanner(`Reset to Factory Default: Baseline Indian multi-hazard weights restored.`);
  };

  // Custom CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const newDataset = parseCustomCsvDataset(text, file.name.replace(/\.[^/.]+$/, ''));
        setDatasets(prev => [newDataset, ...prev]);
        setSelectedDatasetId(newDataset.id);
        setIsCustomUploadOpen(false);
        setDeploySuccessBanner(`Custom dataset "${newDataset.name}" parsed with ${newDataset.recordCount} rows and ${newDataset.features.length} features!`);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => setUploadError('Failed to read file.');
    reader.readAsText(file);
  };

  // Download trained weights JSON
  const handleDownloadCheckpoint = () => {
    if (!completedSession) return;
    const jsonStr = JSON.stringify(completedSession, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${completedSession.modelId}_${selectedDataset.id}_checkpoint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to render SVG line charts
  const renderSvgChart = (
    data: { x: number; y1: number; y2?: number }[],
    minVal: number,
    maxVal: number,
    y1Color: string,
    y2Color?: string,
    y1Label: string = 'Train',
    y2Label?: string
  ) => {
    if (data.length < 2) {
      return (
        <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-mono">
          Waiting for training epoch data...
        </div>
      );
    }

    const width = 480;
    const height = 150;
    const padding = 25;

    const range = maxVal - minVal || 1;
    const getX = (idx: number) => padding + (idx / (data.length - 1)) * (width - 2 * padding);
    const getY = (val: number) => height - padding - ((val - minVal) / range) * (height - 2 * padding);

    const points1 = data.map((d, i) => `${getX(i)},${getY(d.y1)}`).join(' ');
    const points2 = y2Color && data[0].y2 !== undefined ? data.map((d, i) => `${getX(i)},${getY(d.y2!)}`).join(' ') : null;

    return (
      <div className="space-y-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 bg-slate-950 rounded-lg p-1">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3,3" strokeWidth="0.5" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3,3" strokeWidth="0.5" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />

          {/* Polyline 1 */}
          <polyline fill="none" stroke={y1Color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points1} />

          {/* Polyline 2 */}
          {points2 && (
            <polyline fill="none" stroke={y2Color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points2} />
          )}

          {/* Value labels */}
          <text x={padding} y={padding - 5} fill="#94a3b8" fontSize="9" fontFamily="monospace">
            {maxVal.toFixed(3)}
          </text>
          <text x={padding} y={height - padding + 14} fill="#94a3b8" fontSize="9" fontFamily="monospace">
            {minVal.toFixed(3)}
          </text>
          <text x={width - padding - 20} y={height - padding + 14} fill="#94a3b8" fontSize="9" fontFamily="monospace">
            Ep {data.length}
          </text>
        </svg>

        <div className="flex items-center justify-end gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: y1Color }} />
            <span className="text-slate-600">{y1Label}: {data[data.length - 1].y1.toFixed(3)}</span>
          </div>
          {y2Label && y2Color && data[data.length - 1].y2 !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: y2Color }} />
              <span className="text-slate-600">{y2Label}: {data[data.length - 1].y2!.toFixed(3)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-blue-100 text-blue-800 border border-blue-200">
              Machine Learning Studio
            </span>
            <span className="text-xs text-slate-500 font-mono">ResQ-AI Engine v4.2</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-blue-600" />
            AI Model Training & Dataset Fine-Tuning Studio
          </h1>
          <p className="text-xs text-slate-500">
            Train, fine-tune, and evaluate deep convolutional, temporal sequence, and physics-informed models using authentic Indian disaster datasets.
          </p>
        </div>

        {/* Active Model Status Badge */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1 sm:max-w-xs shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Active Inference Model
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
              F1: {Math.round(activeWeights.f1Score * 100)}%
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 truncate">
            {activeWeights.modelName}
          </div>
          <div className="text-[10px] text-slate-500 truncate font-mono">
            {activeWeights.datasetName}
          </div>
        </div>
      </div>

      {/* Deployment Notification */}
      {deploySuccessBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{deploySuccessBanner}</span>
          </div>
          <button
            onClick={onNavigateToAnalyzer}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
          >
            <span>Test in AI Risk Analyzer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Step 1: Select Model Architecture */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Step 1: Select AI / Deep Learning Architecture
          </h2>
          <span className="text-xs text-slate-500 font-mono">4 Production Architectures</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUPPORTED_MODEL_ARCHITECTURES.map((arch) => {
            const isSelected = selectedArch.id === arch.id;
            return (
              <div
                key={arch.id}
                onClick={() => handleSelectArchitecture(arch)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {arch.family.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{arch.parameterCount}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-xs mb-1">{arch.name}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{arch.inputDescription}</p>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-600">
                  <span>Base F1: <strong className="text-slate-900">{arch.baseF1}</strong></span>
                  <span>ROC-AUC: <strong className="text-emerald-700">{arch.baseRocAuc}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Architecture Layer Diagram */}
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              {selectedArch.name} — Computational Layer Pipeline
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{selectedArch.tag}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[10px]">
            {selectedArch.layerDiagram.map((layer, idx) => (
              <div key={idx} className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80 space-y-1">
                <span className="text-[9px] text-blue-400 font-mono block">L{idx + 1} • {layer.type}</span>
                <span className="font-bold text-slate-100 block">{layer.name}</span>
                <p className="text-[9px] text-slate-400 font-mono leading-tight">{layer.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Select Training Dataset & Custom Ingestion */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            Step 2: Choose Indian Disaster Training Dataset or Upload Custom Data
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomUploadOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload Custom CSV Dataset</span>
            </button>
          </div>
        </div>

        {/* Custom Upload Modal */}
        {isCustomUploadOpen && (
          <div className="p-4 bg-white border border-blue-200 rounded-xl shadow-md space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload Custom Multi-Hazard Telemetry (CSV)
              </h3>
              <button
                onClick={() => setIsCustomUploadOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload any comma-separated values file (.csv). resQ-GIS will automatically parse numeric feature columns, normalize standard deviations, and detect trigger target labels (e.g. <code>landslide</code>, <code>flood</code>, <code>label</code>).
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* Dataset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {datasets.map((d) => {
            const isSelected = selectedDatasetId === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDatasetId(d.id)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {d.hazardType.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                    {d.recordCount.toLocaleString()} Samples
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-xs mb-1">{d.name}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{d.description}</p>

                <div className="text-[10px] text-slate-600 font-mono space-y-0.5 pt-2 border-t border-slate-200">
                  <div>Region: <strong className="text-slate-800">{d.geographicRegion}</strong></div>
                  <div>Features: <strong className="text-slate-800">{d.features.length} telemetry indicators</strong></div>
                  <div>Positive Rate: <strong className="text-emerald-700">{Math.round(d.positiveRate * 100)}%</strong></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Dataset Details & Feature Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Selected Active Training Dataset
              </span>
              <h3 className="text-xs font-bold text-slate-900">{selectedDataset.name}</h3>
              <p className="text-[11px] text-slate-500">{selectedDataset.provenance}</p>
            </div>
            <div className="text-[11px] font-mono text-slate-600 sm:text-right">
              <div>Coverage: <span className="font-semibold text-slate-800">{selectedDataset.temporalCoverage}</span></div>
              <div>Target Variable: <span className="font-semibold text-blue-700">{selectedDataset.targetColumn} (0 / 1)</span></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Telemetry Feature Statistical Distribution
            </span>
            <table className="w-full text-left text-[11px] font-mono text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 text-slate-800 text-[10px] uppercase">
                  <th className="pb-1">Feature Name</th>
                  <th className="pb-1">Description / Unit</th>
                  <th className="pb-1">Min</th>
                  <th className="pb-1">Mean</th>
                  <th className="pb-1">Max</th>
                  <th className="pb-1">StdDev</th>
                  <th className="pb-1">Initial Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedDataset.features.map((f) => (
                  <tr key={f.name}>
                    <td className="py-1 font-semibold text-slate-900">{f.name}</td>
                    <td className="py-1">{f.label} ({f.unit})</td>
                    <td className="py-1">{f.min}</td>
                    <td className="py-1">{f.mean}</td>
                    <td className="py-1">{f.max}</td>
                    <td className="py-1">{f.stdDev}</td>
                    <td className="py-1 text-blue-600 font-bold">{f.importanceWeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 3: Hyperparameter Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            Step 3: Training Hyperparameters & Optimization Configuration
          </h2>
          <span className="text-xs text-slate-500 font-mono">Gradient Descent Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs">
          {/* Epochs */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-600">
              <label className="font-semibold">Training Epochs</label>
              <span className="font-mono font-bold text-blue-600">{epochs}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={epochs}
              disabled={isTraining}
              onChange={e => setEpochs(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">5 to 50 iterations</span>
          </div>

          {/* Learning Rate */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Learning Rate (α)</label>
            <select
              value={learningRate}
              disabled={isTraining}
              onChange={e => setLearningRate(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 cursor-pointer"
            >
              <option value="0.001">0.001 (Conservative)</option>
              <option value="0.003">0.003 (Balanced)</option>
              <option value="0.005">0.005 (Recommended)</option>
              <option value="0.01">0.01 (Rapid)</option>
              <option value="0.05">0.05 (High Momentum)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">Step size per update</span>
          </div>

          {/* Batch Size */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Batch Size</label>
            <select
              value={batchSize}
              disabled={isTraining}
              onChange={e => setBatchSize(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 cursor-pointer"
            >
              <option value="16">16 samples</option>
              <option value="32">32 samples (Standard)</option>
              <option value="64">64 samples</option>
              <option value="128">128 samples</option>
            </select>
            <span className="text-[10px] text-slate-400 block">Mini-batch gradient chunk</span>
          </div>

          {/* Optimizer */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Optimizer</label>
            <select
              value={optimizer}
              disabled={isTraining}
              onChange={e => setOptimizer(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 cursor-pointer"
            >
              <option value="adam">Adam (Adaptive Moments)</option>
              <option value="sgd">SGD + Momentum (0.9)</option>
              <option value="rmsprop">RMSprop</option>
            </select>
            <span className="text-[10px] text-slate-400 block">Weight update algorithm</span>
          </div>

          {/* Validation Split */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Validation Split</label>
            <select
              value={validationSplit}
              disabled={isTraining}
              onChange={e => setValidationSplit(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 cursor-pointer"
            >
              <option value="0.1">10% Holdout Test</option>
              <option value="0.2">20% Holdout Test (Standard)</option>
              <option value="0.3">30% Holdout Test</option>
            </select>
            <span className="text-[10px] text-slate-400 block">Out-of-sample partition</span>
          </div>

          {/* Regularization */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">L2 Regularization (λ)</label>
            <select
              value={l2Regularization}
              disabled={isTraining}
              onChange={e => setL2Regularization(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 cursor-pointer"
            >
              <option value="0">0.0 (None)</option>
              <option value="0.0005">0.0005 (Light)</option>
              <option value="0.001">0.001 (Recommended)</option>
              <option value="0.005">0.005 (Strong Ridge)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">Prevents slope overfitting</span>
          </div>
        </div>

        {/* Start / Stop Training CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>
              Ready to train <strong>{selectedArch.name}</strong> on <strong>{selectedDataset.recordCount.toLocaleString()}</strong> telemetry vectors.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isTraining ? (
              <button
                type="button"
                onClick={handleStopTraining}
                className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Training</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTraining}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Train Model on Dataset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step 4: Live Training Progress & Trajectory Dashboard */}
      {(isTraining || history.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Live Training Convergence & Loss Diagnostics
              </h2>
              {isTraining && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                  Epoch {currentEpoch} / {epochs}
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(currentEpoch / epochs) * 100}%` }}
              />
            </div>
          </div>

          {/* Loss Curve & Accuracy Curve Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Loss Chart */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  Loss Trajectory (Binary Cross-Entropy)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Lower is better</span>
              </div>
              {renderSvgChart(
                history.map(h => ({ x: h.epoch, y1: h.trainLoss, y2: h.valLoss })),
                Math.max(0, Math.min(...history.map(h => Math.min(h.trainLoss, h.valLoss))) * 0.9),
                Math.max(...history.map(h => Math.max(h.trainLoss, h.valLoss)), 0.6),
                '#3b82f6',
                '#f59e0b',
                'Train Loss',
                'Val Loss'
              )}
            </div>

            {/* Accuracy & F1 Chart */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Validation Accuracy & F1-Score Trajectory
                </span>
                <span className="text-[10px] font-mono text-slate-500">Higher is better</span>
              </div>
              {renderSvgChart(
                history.map(h => ({ x: h.epoch, y1: h.valAccuracy, y2: h.f1Score })),
                0.60,
                1.00,
                '#10b981',
                '#8b5cf6',
                'Val Accuracy',
                'F1 Score'
              )}
            </div>
          </div>

          {/* Epoch Console Stream */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Epoch Computational Output & Gradient Stream
            </span>
            <div className="bg-slate-950 text-slate-300 font-mono text-xs rounded-xl p-4 max-h-48 overflow-y-auto space-y-1 border border-slate-800">
              {liveLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.startsWith('[Epoch') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.startsWith('[COMPLETE') ? (
                    <span className="text-blue-400 font-bold">{log}</span>
                  ) : log.startsWith('[ERROR') ? (
                    <span className="text-rose-400 font-bold">{log}</span>
                  ) : (
                    <span className="text-slate-400">{log}</span>
                  )}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Post-Training Evaluation Suite & Weights Deployment */}
      {completedSession && completedSession.finalMetrics && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold uppercase bg-emerald-600 text-white">
                  Training Complete
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {completedSession.modelName} on {completedSession.datasetName}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Validated Evaluation Report & Learned Spatial Weights
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleDownloadCheckpoint}
                className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Weights (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleDeployModel}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Deploy to Live AI Risk Analyzer</span>
              </button>
            </div>
          </div>

          {/* Evaluation Scorecards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">F1-Score</span>
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {(completedSession.finalMetrics.f1Score * 100).toFixed(1)}%
              </span>
              <p className="text-[10px] text-slate-500">Harmonic mean of precision & recall</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">ROC-AUC</span>
              <span className="text-2xl font-bold font-mono text-blue-700">
                {completedSession.finalMetrics.rocAuc.toFixed(3)}
              </span>
              <p className="text-[10px] text-slate-500">Separability index against random guess</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Validation Accuracy</span>
              <span className="text-2xl font-bold font-mono text-indigo-700">
                {(completedSession.finalMetrics.valAccuracy * 100).toFixed(1)}%
              </span>
              <p className="text-[10px] text-slate-500">Holdout validation accuracy</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Final Loss</span>
              <span className="text-2xl font-bold font-mono text-slate-800">
                {completedSession.finalMetrics.finalLoss.toFixed(4)}
              </span>
              <p className="text-[10px] text-slate-500">Binary Cross-Entropy with L2</p>
            </div>
          </div>

          {/* Confusion Matrix & Feature Weights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Confusion Matrix */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Holdout Confusion Matrix (2x2)</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {completedSession.finalMetrics.confusionMatrix.truePositive +
                    completedSession.finalMetrics.confusionMatrix.falsePositive +
                    completedSession.finalMetrics.confusionMatrix.trueNegative +
                    completedSession.finalMetrics.confusionMatrix.falseNegative} validation instances
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="bg-emerald-100/70 border border-emerald-300 p-3 rounded-lg space-y-1">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">True Positive (TP)</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {completedSession.finalMetrics.confusionMatrix.truePositive}
                  </span>
                  <p className="text-[9px] text-emerald-700">Correctly Flagged Hazard</p>
                </div>

                <div className="bg-rose-100/70 border border-rose-300 p-3 rounded-lg space-y-1">
                  <span className="text-[10px] text-rose-800 font-bold block uppercase">False Positive (FP)</span>
                  <span className="text-lg font-bold text-rose-900">
                    {completedSession.finalMetrics.confusionMatrix.falsePositive}
                  </span>
                  <p className="text-[9px] text-rose-700">False Alarm Rate</p>
                </div>

                <div className="bg-amber-100/70 border border-amber-300 p-3 rounded-lg space-y-1">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase">False Negative (FN)</span>
                  <span className="text-lg font-bold text-amber-900">
                    {completedSession.finalMetrics.confusionMatrix.falseNegative}
                  </span>
                  <p className="text-[9px] text-amber-700">Missed Trigger Rate</p>
                </div>

                <div className="bg-blue-100/70 border border-blue-300 p-3 rounded-lg space-y-1">
                  <span className="text-[10px] text-blue-800 font-bold block uppercase">True Negative (TN)</span>
                  <span className="text-lg font-bold text-blue-900">
                    {completedSession.finalMetrics.confusionMatrix.trueNegative}
                  </span>
                  <p className="text-[9px] text-blue-700">Correctly Cleared Safe</p>
                </div>
              </div>
            </div>

            {/* Feature Importance Bar Chart */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Learned Feature Weights / Sensitivity</span>
                <span className="text-[10px] text-slate-500 font-mono">Gradients magnitude</span>
              </h3>

              <div className="space-y-2 text-xs">
                {completedSession.finalMetrics.featureImportance.map((f) => (
                  <div key={f.feature} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">{f.label}</span>
                      <span className="font-mono text-blue-700 font-bold">{Math.round(f.weight * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, f.weight * 250)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Architecture synthesis parameters */}
          <div className="bg-slate-900 text-white rounded-xl p-4 text-xs font-mono space-y-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              Multi-Scale Inference Ensemble Weight Distribution
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">CNN Spatial Weight:</span>
                <strong className="text-blue-400 text-sm">{completedSession.learnedWeights.cnnSpatialWeight}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">LSTM Temporal Weight:</span>
                <strong className="text-emerald-400 text-sm">{completedSession.learnedWeights.lstmTemporalWeight}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Geospatial Physics Weight:</span>
                <strong className="text-amber-400 text-sm">{completedSession.learnedWeights.geospatialPhysicsWeight}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Historical Prior Weight:</span>
                <strong className="text-purple-400 text-sm">{completedSession.learnedWeights.historicalPriorWeight}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset & Advanced Tools */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" />
          <span>Models conform to India Sovereign GIS disaster management specifications.</span>
        </div>
        <button
          type="button"
          onClick={handleResetWeights}
          className="text-slate-600 hover:text-rose-600 font-medium cursor-pointer underline flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset to Factory Baseline Weights</span>
        </button>
      </div>
    </div>
  );
};
