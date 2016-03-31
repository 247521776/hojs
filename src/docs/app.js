'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

function jsonStringify(data, space) {
  var seen = [];
  return JSON.stringify(data, function (key, val) {
    if (!val || typeof val !== 'object') {
      return val;
    }
    if (seen.indexOf(val) !== -1) {
      return '[Circular]';
    }
    seen.push(val);
    return val;
  }, space);
}

function makeSchemaNav(schema) {
  return (
    <div className="nav-item" key={schema.id}>
      <a href={`#${schema.id}`}>{schema.title} <span className="sub-text">{schema.route}</span></a>
    </div>
  );
}

function makeGroupSchemaNav(name, schemas) {
  const list = schemas.map(makeSchemaNav);
  return (
    <div className="nav-group" key={name}>
      <h3 className="title">{name}</h3>
      <div className="list">{list}</div>
    </div>
  );
}

function makeTypeDocs(type) {
  return (
    <div className="type-item" key={type.name}>
      <h3 className="type-name">{type.name} <small className="sub-text">{type.description}</small></h3>
      <div className="type-define">
        <pre className="prettyprint javascript">checker = {type.checker}</pre>
        <pre className="prettyprint javascript">formatter = {type.formatter}</pre>
      </div>
    </div>
  );
}

function makeGroupDocs(group, schemas) {
  return (
    <div key={group}>
      {schemas}
    </div>
  );
}

function makeSchemaDocs(schema) {

  const TYPE = DOCS_DATA.types;

  const params = Object.keys(schema.params)
  .map(name => {
    schema.params[name].name = name;
    return schema.params[name];
  })
  .filter(info => !info.hide)
  .map(info => {
    const type = TYPE[info.type];
    return (
      <div className="param-item" key={info.name}>
        <span className="param-name">{info.name}</span>
        <span className="param-type">{info.type}<span className="type-description">{type.isDefault ? '' : type.description}</span></span>
        <span className="param-comment">{info.comment} ({'default' in info ? <span className="param-default">默认值:{jsonStringify(info.default)}</span> : '默认值:无'})</span>
      </div>
    );
  });

  const requiredParams = schema.required.map(name => {
    return (
      <div key={name}>
        <span className="param-name">{name}</span>
      </div>
    );
  }).concat(schema.requiredOneOf.map(names => {
    return (
      <div key={names}>
        <span className="param-name">{names.join(', ')} 其中一个</span>
      </div>
    );
  }));

  const examples = schema.examples.map(({description, input, output}, i) => {
    function makeLines(description) {
      return description.trim().split('\n').map(line => `// ${line.trim()}`).join('\n');
    }
    return (
      <div className="example" key={i}>
        <pre className="prettyprint javascript">{description ? makeLines(description) : ''}</pre>
        <pre className="prettyprint javascript">input = {jsonStringify(input, 2)};</pre>
        <pre className="prettyprint javascript">output = {jsonStringify(output, 2)};</pre>
      </div>
    );
  });

  setTimeout(prettyPrint, 100);

  return (
    <div className="schema" key={schema.route} id={schema.id}>
      <h2 className="title"><a href={`#${schema.id}`}>{schema.title} <small className="sub-text">{schema.route}</small></a></h2>
      <div className="description">{schema.description}</div>
      <div className="group">分组：{schema.group}</div>
      <div className="source-file">源文件：{schema.sourceFile.relative}</div>
      {params.length < 1 ? null :
      <div className="block">
        <div className="block-title">请求参数</div>
        {params}
      </div>
      }
      {requiredParams.length < 1 ? null :
      <div className="block">
        <div className="block-title">必须参数</div>
        {requiredParams}
      </div>
      }
      {examples.length < 1 ? null :
      <div className="block">
        <div className="block-title">使用示例</div>
        {examples}
      </div>
      }
    </div>
  );
}

class App extends React.Component {
  render() {

    DOCS_DATA.schemas.forEach(v => {
      v.route = `${v.method.toUpperCase()} ${v.path}`;
      v.id = `[${v.method.toUpperCase()}]${v.path}`;
    });
    DOCS_DATA.typeList = Object.keys(DOCS_DATA.types).map(n => {
      const ret = DOCS_DATA.types[n];
      ret.name = n;
      return ret;
    }).filter(v => !v.isDefault);
    const types = DOCS_DATA.typeList.map(makeTypeDocs);

    const groupMap = {};
    for (const item of DOCS_DATA.schemas) {
      item.group = item.group || 'global';
      if (!groupMap[item.group]) groupMap[item.group] = [];
      groupMap[item.group].push(item);
    }
    const groups = [];
    for (const i in groupMap) {
      const schemas = groupMap[i].map(makeSchemaDocs);
      groups.push(makeGroupDocs(i, schemas));
    }

    const nav = Object.keys(groupMap).map(name => makeGroupSchemaNav(name, groupMap[name]));

    return (
      <div className="container">
        <div className="nav">
          <div className="fixed">
            <div className="nav-group">
              <h3 className="title">全局</h3>
              <div className="nav-item">
                <a href="#global:types">自定义类型</a>
              </div>
            </div>
            {nav}
          </div>
        </div>
        <div className="main">
          <div className="section types">
            <h1 id="global:types">自定义类型</h1>
            {types}
          </div>
          <div className="section schemas">
            <h1>API列表</h1>
            {groups}
          </div>
        </div>
      </div>
    );
  }
}


ReactDOM.render(<App />, document.getElementById('app'));
