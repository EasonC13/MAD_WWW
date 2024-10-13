export const ProcessProgress = ({ processTasks }: any) => {
  const totalTasks = Object.keys(processTasks).length;
  const completedTasks = Object.values(processTasks).filter(Boolean).length;

  if (completedTasks < totalTasks) {
    return (
      <div className="flex items-center justify-center mt-3">
        <span className="text-white py-2 px-4 rounded">
          {completedTasks} / {totalTasks} function generation completed
        </span>
      </div>
    );
  }
  return null;
};
