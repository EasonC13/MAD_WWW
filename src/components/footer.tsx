import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 bg-black text-white text-xs md:pb-10 px-16 text-center">
      <div className="flex justify-center md:justify-start">
        {/* <Image
          className="w-48 xl:w-71 xl:h-21"
          src="/images/bucket-black-logo-with-word.svg"
          alt="bucket logo"
          width="285"
          height="84"
          loading="eager"
        /> */}
      </div>
      <div className="flex justify-center md:justify-end gap-5">
        {/* <a
          href="http://discord.gg/invalid"
          rel="noopener noreferrer"
          target="_blank"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="none"
            viewBox="0 0 18 18"
            className="h-5 w-5"
            aria-label="Mysten Labs Discord"
          >
            <path
              fill="currentColor"
              d="M14.198 4.231a12.368 12.368 0 0 0-3.053-.947.046.046 0 0 0-.05.023c-.131.235-.277.54-.38.781a11.42 11.42 0 0 0-3.429 0 7.903 7.903 0 0 0-.386-.78.048.048 0 0 0-.049-.024 12.335 12.335 0 0 0-3.053.947.044.044 0 0 0-.02.017c-1.945 2.906-2.477 5.74-2.216 8.538a.051.051 0 0 0 .02.035 12.44 12.44 0 0 0 3.745 1.894c.02.006.04-.002.053-.018a8.89 8.89 0 0 0 .766-1.246.047.047 0 0 0-.026-.066 8.204 8.204 0 0 1-1.17-.558.048.048 0 0 1-.005-.08c.079-.058.157-.12.232-.182a.047.047 0 0 1 .049-.006c2.455 1.12 5.112 1.12 7.538 0a.046.046 0 0 1 .05.006c.075.062.153.124.232.183a.048.048 0 0 1-.004.08 7.691 7.691 0 0 1-1.17.556.048.048 0 0 0-.026.067c.225.436.483.852.766 1.246a.048.048 0 0 0 .052.018 12.399 12.399 0 0 0 3.752-1.894.048.048 0 0 0 .02-.034c.312-3.236-.524-6.046-2.218-8.538a.038.038 0 0 0-.02-.018Zm-7.685 6.851c-.74 0-1.349-.678-1.349-1.512 0-.833.598-1.512 1.349-1.512.756 0 1.36.685 1.348 1.512 0 .834-.598 1.512-1.348 1.512Zm4.984 0c-.74 0-1.348-.678-1.348-1.512 0-.833.597-1.512 1.348-1.512.757 0 1.36.685 1.348 1.512 0 .834-.591 1.512-1.348 1.512Z"
            ></path>
          </svg>
        </a>
        <a
          href="https://twitter.com/bucket_protocol"
          rel="noopener noreferrer"
          target="_blank"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="none"
            viewBox="0 0 18 18"
            className="h-5 w-5"
            aria-label="Bucket Protocol Twitter"
          >
            <path
              fill="currentColor"
              d="M14.964 5.94c.01.132.01.265.01.398 0 4.066-3.096 8.756-8.757 8.756v-.002a8.713 8.713 0 0 1-4.717-1.38 6.18 6.18 0 0 0 4.555-1.275A3.081 3.081 0 0 1 3.179 10.3c.462.089.937.07 1.39-.053A3.078 3.078 0 0 1 2.1 7.23v-.039c.428.238.907.37 1.397.385a3.081 3.081 0 0 1-.953-4.109 8.735 8.735 0 0 0 6.343 3.215 3.08 3.08 0 0 1 5.244-2.807 6.175 6.175 0 0 0 1.955-.747 3.089 3.089 0 0 1-1.353 1.702 6.12 6.12 0 0 0 1.767-.484 6.254 6.254 0 0 1-1.536 1.594Z"
            ></path>
          </svg>
        </a>
        */}
      </div>
      <a
        href="https://bucketprotocol.io/"
        target="_blank"
        className="flex justify-center md:justify-start"
      >
        {/* ©2023 Bucket Team. All rights reserved. */}
        {/* Developed by{" "} */}
        {/* <>
          <img
            className="h-4 md:h-1em w-auto mx-1"
            src="/images/bucket-white-logo.png"
          />
          Bucket Ecosystem Product
        </> */}
      </a>
      <div className="flex justify-center md:justify-end gap-2">
        {/* <a rel="noopener noreferrer" href="/legal/terms" target="_blank">
          Terms &amp; Conditions
        </a>
        <a rel="noopener noreferrer" href="/legal/privacy" target="_blank">
          Privacy Policy
        </a> */}
      </div>
    </div>
  );
};

export default Footer;
