import Task from '@/models/Task';
import Pipeline from '@/models/Pipeline';
import { notifyAll } from '@/lib/sse';
import { sendPushToWorker } from '@/lib/push';
import type { ITask } from '@/models/Task';

// Vazifa "completed" bo'lganda ish zanjirini (pipeline) keyingi bosqichga o'tkazadi:
// keyingi bosqich uchun yangi vazifa yaratadi yoki zanjirni yakunlaydi.
// Admin (/api/tasks/[id]) va mobil (/api/mobile/tasks/[id]) ikkalasi ham ishlatadi.
export async function advancePipelineOnComplete(task: ITask | null): Promise<void> {
  if (!task?.pipelineId) return;

  const pipeline = await Pipeline.findById(task.pipelineId);
  if (!pipeline || pipeline.status !== 'active') return;

  const nextIndex = (task.stepIndex ?? 0) + 1;

  if (nextIndex < pipeline.steps.length) {
    const nextStep = pipeline.steps[nextIndex];
    await Task.create({
      title: nextStep.title,
      worker: nextStep.worker,
      department: nextStep.department,
      deadline: nextStep.deadline,
      order: task.order || null,
      pipelineId: pipeline._id,
      stepIndex: nextIndex,
      status: 'pending',
      company: task.company,
    });
    await Pipeline.findByIdAndUpdate(pipeline._id, { currentStep: nextIndex });
    notifyAll();
    // Keyingi bosqich ishchisiga push bildirishnoma
    if (nextStep.worker) {
      void sendPushToWorker(String(nextStep.worker), {
        title: '🛠 Yangi vazifa',
        body: nextStep.title,
        url: '/ish',
      });
    }
  } else {
    await Pipeline.findByIdAndUpdate(pipeline._id, { status: 'completed' });
  }
}
