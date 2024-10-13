import { GetStaticProps, InferGetStaticPropsType } from "next";
import { createSwaggerSpec } from "next-swagger-doc";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { useEffect } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

function ApiDoc({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {
  useEffect(() => {
    // When the component is mounted, ensure the hash in the URL is reflected
    if (window.location.hash) {
      const elementId = window.location.hash.slice(1);
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, []);

  return (
    <div className="bg-white p-4 w-full">
      <SwaggerUI
        spec={spec}
        deepLinking={true}
        docExpansion="none" // Collapse all by default
        onComplete={() => {
          // Automatically scroll to the section if there's a hash
          if (window.location.hash) {
            const elementId = window.location.hash.slice(1);
            const element = document.getElementById(elementId);
            if (element) {
              element.scrollIntoView();
            }
          }
        }}
      />
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const spec: Record<string, any> = createSwaggerSpec({
    apiFolder: "src/pages/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "MoveAiBot API Documents",
        version: "1.0",
      },
    },
  });

  return {
    props: {
      spec,
    },
  };
};

export default ApiDoc;
