const { configure } = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

// Setup enzyme's react adapter
configure({ adapter: new Adapter() });
