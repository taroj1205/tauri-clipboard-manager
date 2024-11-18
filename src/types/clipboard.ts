export type ClipboardHistory = {
  id: number;
  content: string;
  first_copied_date: string;
  last_copied_date: string;
  window_title: string;
  window_exe: string;
  type: string;
  count: number;
  image: string;
  html: string;
};

export type ActiveWindowProps = {
  title: string;
  process_path: string;
  app_name: string;
  window_id: string;
  process_id: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};