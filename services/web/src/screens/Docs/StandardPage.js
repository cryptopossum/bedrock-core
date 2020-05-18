import React from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import 'github-markdown-css';
import { API_URL, APP_NAME } from 'utils/env';
import { flatten } from 'lodash';
import { request } from '../../utils';

class Macros {
  constructor(openApi) {
    this.openApi = openApi;
    this.paths = flatten(openApi.map((module) => module.paths || []));
    this.objects = flatten(openApi.map((module) => module.objects || []));
  }
  callHeading({ method, path }) {
    return `#### \`${method} ${path}\``;
  }
  callParams({ method, path }) {
    const definition = this.paths.find((d) => d.method === method && d.path === path);
    if (!definition) return `\`Could not find API call for ${method} ${path}\``;
    const parameterType = definition.requestBody ? 'JSON Body' : 'Request Query';
    let markdown = [`${parameterType} Parameters:\n`, '| Key | Type | Required | Description |', '|--|--|--|--|'];
    const params = definition.requestBody || definition.requestQuery || [];
    if (!params || !params.length) return '';
    params.forEach(({ name, schema, required, description }) => {
      const typeStr = schema ? schema.type : 'unknown';
      const requiredStr = required ? 'Yes' : 'No';
      let descriptionStr = description || '';
      if (schema.default) {
        descriptionStr += `(Default: ${schema.default})`;
      }
      markdown.push(`|\`${name}\`|${typeStr}|${requiredStr}|${descriptionStr}|`);
    });
    return markdown.join('\n');
  }
  callResponse({ method, path }) {
    const definition = this.paths.find((d) => d.method === method && d.path === path);
    if (!definition) return `\`Could not find API call for ${method} ${path}\``;
    const { responseBody } = definition;
    if (!responseBody || !responseBody.length) return '';
    let markdown = [`Response Body:\n`, '| Key | Type | Description |', '|--|--|--|--|'];
    responseBody.forEach(({ name, schema, description }) => {
      const typeStr = schema ? schema.type : 'unknown';
      let descriptionStr = description || '';
      if (schema && schema.default) {
        descriptionStr += `(Default: ${schema.default})`;
      }
      markdown.push(`|\`${name}\`|${typeStr}|${descriptionStr}|`);
    });
    return markdown.join('\n');
  }
  callExamples({ method, path }) {
    const definition = this.paths.find((d) => d.method === method && d.path === path);
    if (!definition) return `\`Could not find API call for ${method} ${path}\``;
    const { examples } = definition;
    if (!examples || !examples.length) return '';
    const markdown = [];
    examples.forEach(({ name, requestBody, responseBody }) => {
      markdown.push(`#### Example: ${name}`);
      if (requestBody) {
        markdown.push(`Request JSON Body:\n`);
        markdown.push('```json\n' + JSON.stringify(requestBody, null, 2) + '\n```');
      }
      if (responseBody) {
        markdown.push(`Response:\n`);
        markdown.push('```json\n' + JSON.stringify(responseBody, null, 2) + '\n```\n');
      }
    });
    return markdown.join('\n');
  }
  callSummary({ method, path }) {
    const markdown = [];
    markdown.push(this.callHeading({ method, path }));
    markdown.push(this.callParams({ method, path }));
    const responseMd = this.callResponse({ method, path });
    if (responseMd) {
      markdown.push(responseMd);
    }
    const examplesMd = this.callExamples({ method, path });
    if (examplesMd) {
      markdown.push(examplesMd);
    }
    return markdown.join('\n');
  }
  objectSummary({ name }) {
    const definition = this.objects.find((d) => d.name === name);
    if (!definition) return `\`Could not find object for ${name}\``;
    console.log('definition', definition);
    let markdown = [`Attributes:\n`, '| Key | Type | Description |', '|--|--|--|--|'];
    const { attributes } = definition;
    attributes.forEach(({ name, schema, description }) => {
      const typeStr = schema ? schema.type : 'unknown';
      let descriptionStr = description || '';
      markdown.push(`|\`${name}\`|${typeStr}|${descriptionStr}|`);
    });
    return markdown.join('\n');
  }
}

function executeMacros(macros, markdown) {
  Object.getOwnPropertyNames(Macros.prototype).forEach((macroFn) => {
    const key = macroFn.toString();
    const re = new RegExp(key + '\\(' + '[^)]+' + '\\)', 'gm');
    const matches = markdown.match(re);
    matches &&
      matches.forEach((match) => {
        const result = eval(`macros.${match}`);
        markdown = markdown.replace(match, result);
      });
  });
  return markdown;
}

function enrichMarkdown(markdown, me, credentials) {
  const { organization } = me;
  let enrichedMarkdown = markdown;
  if (organization) {
    enrichedMarkdown = enrichedMarkdown.replace(new RegExp('<ORGANIZATION_ID>', 'g'), organization.id);
  }
  if (credentials && credentials.length) {
    enrichedMarkdown = enrichedMarkdown.replace(new RegExp('<TOKEN>', 'g'), credentials[0].apiToken);
  }
  enrichedMarkdown = enrichedMarkdown.replace(new RegExp('<API_URL>', 'g'), API_URL.replace(/\/$/, ''));
  enrichedMarkdown = enrichedMarkdown.replace(new RegExp('<APP_NAME>', 'g'), APP_NAME.replace(/\/$/, ''));
  return enrichedMarkdown;
}

export default class StandardPage extends React.Component {
  render() {
    const { credentials, me, page, openApi } = this.props;
    const macros = new Macros(openApi);
    let markdown = enrichMarkdown(page.markdown, me, credentials);
    markdown = executeMacros(macros, markdown);
    return (
      <div className="docs markdown-body">
        <ReactMarkdown source={markdown} renderers={{ code: CodeBlock }} />
      </div>
    );
  }
}
