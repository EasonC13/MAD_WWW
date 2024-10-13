import React from "react";

export function ModuleSelector({
  modules,
  handleSelectModule,
  getModuleButtonStyle,
  extraButtons,
}: any) {
  return (
    <div className="flex flex-col gap-2 mt-20 ">
      {Object.keys(modules).map((moduleName) => (
        <button
          key={moduleName}
          onClick={() => handleSelectModule(moduleName)}
          className={getModuleButtonStyle(moduleName)}
        >
          {moduleName}
        </button>
      ))}
      {extraButtons && extraButtons}
    </div>
  );
}
