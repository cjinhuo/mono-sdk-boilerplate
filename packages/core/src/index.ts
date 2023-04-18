import fs from 'fs'
import path from 'path'
const tableData = {
  name: 'table name',
  details_url: 'https://cjinhuo.netlify.app/',
  output: {
    summary: `<style>
  .my-table {
    border-collapse: collapse;
    width: 100%;
  }
  .my-table th, .my-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  .my-table th {
    background-color: #f2f2f2;
  }
  .my-table tr:nth-child(even) {
    background-color: #f2f2f2;
  }
  .my-table tr:hover {
    background-color: #ddd;
  }
  .my-table-cell--plus::before {
    color: green;
    margin-right: 4px;
  }
  .my-table-cell--minus::before {
    color: red;
    margin-right: 4px;
  }
</style>

<table class="my-table">
  <thead>
    <tr>
      <th class="my-table-header">name</th>
      <th class="my-table-header">size</th>
      <th class="my-table-header">loading</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="my-table-cell">@slardar/web - ES5 CDN Script (minified)</td>
      <td class="my-table-cell my-table-cell--plus">43270 (+0.03%)</td>
      <td class="my-table-cell">0.8451171875</td>
    </tr>
    <tr>
      <td class="my-table-cell">@slardar/web - blank-screen (minified)</td>
      <td class="my-table-cell my-table-cell--plus">6158 (+0.16%)</td>
      <td class="my-table-cell">0.1202734375</td>
    </tr>
    <tr>
      <td class="my-table-cell">@slardar/web - ES6 NPM Entrance (minified)</td>
      <td class="my-table-cell my-table-cell--minus">43210 (-0.02%)</td>
      <td class="my-table-cell">0.8439453125</td>
    </tr>
    <tr>
      <td class="my-table-cell">@apmplus/mini-program - ES5 Weixin (minified)</td>
      <td class="my-table-cell">41082 (0%)</td>
      <td class="my-table-cell">0.8023828125</td>
    </tr>
    <tr>
      <td class="my-table-cell">@apmplus/mini-program - ES5 douyin (minified)</td>
      <td class="my-table-cell">41344 (0%)</td>
      <td class="my-table-cell">0.8075</td>
    </tr>
    <tr>
      <td class="my-table-cell">@apmplus/mini-program - ES6 ESM (minified)</td>
      <td class="my-table-cell">7916 (0%)</td>
      <td class="my-table-cell">0.154609375</td>
    </tr>
  </tbody>
</table>`,
    description: 'this is description',
  },
  conclusion: 'this is conclusion',
}

function main() {
  console.log('__dirname', __dirname)
  console.log('path.join table', path.join(__dirname, 'table.json'))
  const checkrunTabelPath = path.join(__dirname, 'table.json')
  fs.writeFileSync(checkrunTabelPath, JSON.stringify(tableData))
  console.info(`::update-check-run::${checkrunTabelPath}`)
}

main()
