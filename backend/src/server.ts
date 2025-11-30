import { API_PORT } from './config';
import app from './app';

app.listen(API_PORT, () => {
  console.log(`✅ Express API ready on http://localhost:${API_PORT}`);
});

