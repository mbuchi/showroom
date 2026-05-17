import ValooWidget from './widgets/ValooWidget';
import RoofsWidget from './widgets/RoofsWidget';
import RootsWidget from './widgets/RootsWidget';
import SoolarWidget from './widgets/SoolarWidget';
import BoomWidget from './widgets/BoomWidget';

// The reporter body: five live widget cards for one location. Each widget
// owns its own data fetch and lifecycle, so this is pure layout. The parent
// keys this component on the coordinates, so a new search remounts all five.

export default function ReportGrid({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ValooWidget lat={lat} lng={lng} />
      <RoofsWidget lat={lat} lng={lng} />
      <RootsWidget lat={lat} lng={lng} />
      <SoolarWidget lat={lat} lng={lng} />
      <BoomWidget lat={lat} lng={lng} />
    </div>
  );
}
