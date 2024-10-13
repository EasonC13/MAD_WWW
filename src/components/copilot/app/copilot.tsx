import React, { useState } from "react";
import { Timeline, Flowbite } from "flowbite-react";
import PlanningStage from "./stages/PlanningStage";
import TimelineIcon from "../base/timelineIcon";
import CodeStage from "./stages/CodeStage";
import SearchStage from "@/components/copilot/app/stages/SearchStage";

interface CopilotProps {
  welcomeInput: string;
  contractType: string;
}

interface ProgramState {
  stage: number;
  definitions: Definition[];
  interfaces: string
}

const Copilot: React.FC<CopilotProps> = ({ welcomeInput, contractType }) => {
  const [programState, setProgramState] = useState<ProgramState>({
    stage: 1,
    definitions: [],
    interfaces: ""
  });

  const setStage = (stage: number) => {
    setProgramState((prevState) => ({
      ...prevState,
      stage
    }));
  };

  const setDefinitions = (definitions: Definition[]) => {
    setProgramState((prevState) => ({
      ...prevState,
      definitions
    }));
  };

  return (
    <main className="relative left-0 top-10 flex size-full flex-col items-center">
      <Flowbite>
        <div className="mt-20 w-1/2 mb-20">
          <h1 className="mb-10 text-2xl text-white">
            {contractType} Design for GPT
          </h1>
          <Timeline>
            {/** STAGE 1: PLANNING START **/}
            <Timeline.Item>
              <TimelineIcon />
              <Timeline.Content className="ml-5">
                <Timeline.Title className="text-white">
                  Stage 1: Planning 🤔
                </Timeline.Title>
                <Timeline.Body>
                  <PlanningStage
                    welcomeInput={welcomeInput}
                    contractType={contractType}
                    definitions={programState.definitions}
                    setDefinitions={setDefinitions}
                    onNextStage={() => setStage(2)}
                  />
                </Timeline.Body>
              </Timeline.Content>
            </Timeline.Item>
            {/** STAGE 1: PLANNING END **/}

            {/** STAGE 2: SEARCH START **/}
            {programState.stage >= 2 && (
              <Timeline.Item>
                <TimelineIcon />
                <Timeline.Content className="ml-5">
                  <Timeline.Title className="text-white">
                    Stage 2: Search SUI Mainnet 🔍
                  </Timeline.Title>
                  <Timeline.Body>
                    <SearchStage onNextStage={() => setStage(3)} />
                  </Timeline.Body>
                </Timeline.Content>
              </Timeline.Item>
            )}
            {/** STAGE 2: SEARCH END **/}

            {/** STAGE 3: CODE START **/}
            {programState.stage >= 3 && (
              <Timeline.Item>
                <TimelineIcon />
                <Timeline.Content className="ml-5">
                  <Timeline.Title className="text-white">
                    Stage 3: Generate SUI Move Code 👩‍💻
                  </Timeline.Title>
                  <Timeline.Body>
                    <CodeStage welcomeInput={welcomeInput} contractType={contractType} definitions={programState.definitions} />
                  </Timeline.Body>
                </Timeline.Content>
              </Timeline.Item>
            )}
            {/** STAGE 3: CODE END **/}
          </Timeline>
        </div>
      </Flowbite>
    </main>
  );
};

export default Copilot;
