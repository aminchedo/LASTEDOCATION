import { Router, Request, Response } from 'express';

const router = Router();

interface Experiment {
  id: string;
  name: string;
  description?: string;
  dataset?: string;
  model?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
  startTime?: string;
  endTime?: string;
  metrics?: Record<string, any>;
  config?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

let experiments: Experiment[] = [];

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: experiments,
    total: experiments.length,
  });
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, dataset, model, config, notes } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Experiment name is required',
      });
    }

    const experiment: Experiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      dataset,
      model,
      status: 'idle',
      progress: 0,
      config,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    experiments.push(experiment);

    return res.json({
      success: true,
      data: experiment,
    });
  } catch (error: any) {
    console.error('Error creating experiment:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create experiment',
    });
  }
});

router.post('/:id/start', (req: Request, res: Response) => {
  const { id } = req.params;
  const experiment = experiments.find((e) => e.id === id);

  if (!experiment) {
    return res.status(404).json({
      success: false,
      error: 'Experiment not found',
    });
  }

  experiment.status = 'running';
  experiment.startTime = new Date().toISOString();
  experiment.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: experiment,
  });
});

router.post('/:id/stop', (req: Request, res: Response) => {
  const { id } = req.params;
  const experiment = experiments.find((e) => e.id === id);

  if (!experiment) {
    return res.status(404).json({
      success: false,
      error: 'Experiment not found',
    });
  }

  experiment.status = 'completed';
  experiment.endTime = new Date().toISOString();
  experiment.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: experiment,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = experiments.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Experiment not found',
    });
  }

  experiments.splice(index, 1);

  return res.json({
    success: true,
    message: 'Experiment deleted',
  });
});

router.get('/:id/download', (req: Request, res: Response) => {
  const { id } = req.params;
  const experiment = experiments.find((e) => e.id === id);

  if (!experiment) {
    return res.status(404).json({
      success: false,
      error: 'Experiment not found',
    });
  }

  const data = JSON.stringify(experiment, null, 2);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="experiment_${id}.json"`);
  return res.send(data);
});

export default router;
