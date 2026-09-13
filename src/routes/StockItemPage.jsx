import { useParams } from 'react-router-dom';
import { StockDetails } from '../components/stock/StockDetails';

export default function StockItemPage() {
  const { id } = useParams();
  return <StockDetails id={id} />;
}
