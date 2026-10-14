import type { SVGProps } from "react";

export function FolderIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 128 112"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 20h43c5.3 0 8.4 2.1 10.8 6.6l5.1 9.2H112c5.5 0 10 4.5 10 10v51c0 5.5-4.5 10-10 10H12C6.5 106 2 101.5 2 96V30c0-5.5 4.5-10 10-10Z"
        fill="#264b38"
      />
      <path
        d="M12 28h40c5.5 0 8.3 2.2 10.8 7l4.5 8H112c5.5 0 10 4.5 10 10v43c0 5.5-4.5 10-10 10H12C6.5 106 2 101.5 2 96V38c0-5.5 4.5-10 10-10Z"
        fill="#5f8a68"
      />
    </svg>
  );
}
