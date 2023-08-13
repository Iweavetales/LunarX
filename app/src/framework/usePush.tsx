import { useNavigate } from 'react-router';
export const usePush = () => {
  const navigate = useNavigate();
  // const r = useRouter();

  return navigate;
};
