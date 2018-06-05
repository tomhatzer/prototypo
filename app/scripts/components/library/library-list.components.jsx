import React from 'react';
import pleaseWait from 'please-wait';
import PropTypes from 'prop-types';
import Lifespan from 'lifespan';
import LocalClient from '../../stores/local-client.stores';
import ScrollArea from 'react-scrollbar/dist/no-css';
import FontUpdater from "../font-updater.components";
import {graphql, gql, compose} from 'react-apollo';

class LibraryList extends React.PureComponent {
	constructor(props) {
		super(props);

		this.state = {};
	}
	async componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();

		const prototypoStore = await this.client.fetch('/prototypoStore');

		this.setState({
			templateInfos: prototypoStore.head.toJS().templateList,
		});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	render() {
		return (
			<div className="library-list">
				<FamilyList libraryFilters={this.props.libraryFilters} userProjects={this.props.families} presets={this.props.presets} templateInfos={this.state.templateInfos} user={{firstName: this.props.firstName, lastName: this.props.lastName}}/>
			</div>
		);
	}
}

export const libraryQuery = gql`
	query {
		user {
			id
			library {
				id
				name
				template
				variants {
					id
					name
					values
				}
			}
		}
	}
`;

const getNameQuery = gql`
	query getFirstName {
		user {
			id
			firstName
			lastName
		}
	}
`;

export const presetQuery = gql`
	query {
		getAllUniquePresets {
			presets
		}
	}
`

LibraryList.propTypes = {
	families: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string,
		name: PropTypes.string,
		template: PropTypes.string,
	})).isRequired,
};

LibraryList.defaultProps = {
	families: [],
};

export default compose(
	graphql(libraryQuery, {
		options: {
			fetchPolicy: 'network-only',
		},
		props: ({data}) => {
			if (data.loading) {
				return {loading: true};
			}

			if (data.user) {
				return {
					families: data.user.library,
					refetch: data.refetch,
				};
			}

			return {refetch: data.refetch};
		},
	}),
	graphql(getNameQuery, {
		options: {
			fetchPolicy: 'cache-first',
		},
		props: ({data}) => {
			if (data.loading) {
				return {loading: true, firstName: '', lastName: '',};
			}
	
			return data.user;
		},
	}),
	graphql(presetQuery, {
		options: {
			fetchPolicy: 'network-only',
		},
		props: ({data}) => {
			if (data.loading) {
				return {loading: true};
			}

			if (data.getAllUniquePresets) {
				return {
					presets: data.getAllUniquePresets.presets,
				};
			}
		},
	}),
)(LibraryList);

class FamilyList extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			isBaseValueLoaded: false,
			activeFilters: {}
		}
		this.loadInitialValues = this.loadInitialValues.bind(this);
		this.generateFonts = this.generateFonts.bind(this);
		this.filterFonts = this.filterFonts.bind(this);
	}

	async loadInitialValues() {
		const typedataAntique = await import(/* webpackChunkName: "ptfs" */`../../../../dist/templates/antique.ptf/font.json`);
		const antiqueInitValues = {};
		typedataAntique.controls.forEach(group => group.parameters.forEach((param) => {
			antiqueInitValues[param.name] = param.init;
		}));
		const typedataElzevir = await import(/* webpackChunkName: "ptfs" */`../../../../dist/templates/elzevir.ptf/font.json`);
		const elzevirInitValues = {};
		typedataElzevir.controls.forEach(group => group.parameters.forEach((param) => {
			elzevirInitValues[param.name] = param.init;
		}));
		const typedataSpectral = await import(/* webpackChunkName: "ptfs" */`../../../../dist/templates/gfnt.ptf/font.json`);
		const spectralInitValues = {};
		typedataSpectral.controls.forEach(group => group.parameters.forEach((param) => {
			spectralInitValues[param.name] = param.init;
		}));
		const typedataFell = await import(/* webpackChunkName: "ptfs" */`../../../../dist/templates/john-fell.ptf/font.json`);
		const fellInitValues = {};
		typedataFell.controls.forEach(group => group.parameters.forEach((param) => {
			fellInitValues[param.name] = param.init;
		}));
		const typedataVenus = await import(/* webpackChunkName: "ptfs" */`../../../../dist/templates/venus.ptf/font.json`);
		const venusInitValues = {};
		typedataVenus.controls.forEach(group => group.parameters.forEach((param) => {
			venusInitValues[param.name] = param.init;
		}));
		this.setState({
			'antique.ptf': antiqueInitValues,
			'elzevir.ptf': elzevirInitValues,
			'gfnt.ptf': spectralInitValues,
			'john-fell.ptf': fellInitValues,
			'venus.ptf': venusInitValues,
			isBaseValueLoaded: true,
		});
		this.generateFonts();
	}

	generateFonts() {
		const customBadgesColor = [
			'#29ABE2',
			'#0000FF',
			'#00FF00',
			'#FF0000',
			'#F7931E'
		]
		const userColor = customBadgesColor[0];
		const lmColor = customBadgesColor[1];
		const hmColor = customBadgesColor [4];

		let fontsToGenerate = [];
		let fontData = [];

		this.props.templateInfos && this.props.templateInfos.map((template) => {
			if (this.state.isBaseValueLoaded) {
				fontsToGenerate.push(
					{
						name: `template${(template.templateName).split('.').join("")}`,
						template: template.templateName,
						subset: 'Hamburgefonstiv 123',
						values: this.state[template.templateName],
					}
				);
				fontData.push({
					template: template.name,
					name: template.name,
					tags: [template.provider, 'template'],
					designer: template.provider,
					type: 'Template',
					elem: (<TemplateItem
						key={template.templateName}
						template={template}
					/>)
				})
			};
		});
		this.props.presets && this.props.presets.filter(preset => {			
			return (
				preset.variant.family.name !== 'Spectral'
				&& preset.variant.family.name !== 'Elzevir'
				&& preset.variant.family.name !== 'Grotesk'
				&& preset.variant.family.name !== 'Fell'
				&& preset.variant.family.name !== 'Antique'
			);
		}).map((preset => {
			const templateInfo = this.props.templateInfos.find(template => preset.template === template.templateName) || {name: 'Undefined'};
			fontsToGenerate.push(
				{
					name: `preset${preset.id}`,
					template: templateInfo.templateName,
					subset: 'Hamburgefonstiv 123',
					values: preset.baseValues,
				}
			);
			fontData.push({
				template: templateInfo.name,				
				type: 'Presets',
				name: 'Preset',
				designer: templateInfo.provider,
				tags: [templateInfo.provider, 'preset'],
				elem: (<PresetItem
					key={preset.id}
					preset={preset}
					template={templateInfo}
					user={preset.ownerInitials}
					background={preset.ownerInitials === 'LM' ? lmColor : hmColor}
				/>)
			})
		}));
		this.props.userProjects.map((family) => {
			const templateInfo = this.props.templateInfos.find(template => template.templateName === family.template) || {name: 'Undefined'};
			if (this.state.isBaseValueLoaded){
				fontsToGenerate.push(
					{
						name: `user${family.id}`,
						template: templateInfo.templateName,
						subset: 'Hamburgefonstiv 123',
						values: {
							...this.state[templateInfo.templateName],
							...family.variants[0].values
						},
					}
				);
				fontData.push({
					template: templateInfo.name,
					name:  family.name,
					designer: templateInfo.provider,
					tags: [templateInfo.provider, 'project', family.name],
					type: 'Fonts',
					elem: (<FamilyItem
						key={family.id}
						family={family}
						template={templateInfo}
						user={this.props.user}
						background={userColor}
					/>)
				})
			}
		});
		this.setState({
			fontsToGenerate,
			baseFontData: fontData,
			fontsToDisplay: fontData,
		});
	}

	filterFonts() {
		console.log(this.state.activeFilters)
		const { baseFontData } = this.state;
		let fontsToDisplay = baseFontData;
		Object.keys(this.state.activeFilters).forEach(filterBy => {
			fontsToDisplay.filter(e => this.state.activeFilters[filterBy].includes(e[filterBy]));
		});
		this.setState({fontsToDisplay});
	}
	
	componentWillReceiveProps(newProps) {
		if (newProps.presets && newProps.presets.length > 1 && !this.state.isBaseValueLoaded) {
			this.loadInitialValues();
		}
		if (newProps.activeFilters !== this.state.activeFilters) {
			this.setState({activeFilters: newProps.activeFilters});
			this.filterFonts();
		}
	}

	render() {
		

		return (
			<ScrollArea
				className="family-list-families"
				contentClassName="family-list-families-content"
				horizontal={false}
				style={{overflowX: 'visible'}}
			>
				<div className="library-family-list">
					{this.state.fontsToDisplay && this.state.fontsToDisplay.map(font => font.elem)}
					<FontUpdater extraFonts={this.state.fontsToGenerate} />
				</div>
			</ScrollArea>			
		)
	}
}

class TemplateItem extends React.PureComponent {
	constructor(props) {
		super(props)		
	}

	render() {
		return (
			<div className="library-item">
				<p className="library-item-name">
					{this.props.template.name}
				</p>
				<p className="library-item-preview" style={{fontFamily: `template${(this.props.template.templateName).split('.').join("")}`}}>Hamburgefonstiv 123</p>
				<div
						className={`provider provider-${this.props.template.provider}`}
				/>
				
			</div>
		)
	}
}

class FamilyItem extends React.PureComponent {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="library-item">
				<p className="library-item-name">
					{this.props.family.name} from {this.props.template.name}
				</p>
				<p className="library-item-preview" style={{fontFamily: `user${this.props.family.id}`}}>Hamburgefonstiv 123</p>
				<div
						className={`provider provider-custom`}
						style={{backgroundColor: this.props.background}}
				>
					{this.props.user.firstName && this.props.user.firstName.charAt(0)}{this.props.user.lastName && this.props.user.lastName.charAt(0)}
				</div>
			</div>
		)
	}
}

class PresetItem extends React.PureComponent {
	constructor(props) {
		super(props);
	}

	render() {
		return (			
			<div className="library-item">
				<p className="library-item-name">
					Preset from {this.props.template.name}
				</p>
				<p className="library-item-preview" style={{fontFamily: `preset${this.props.preset.id}`}}>Hamburgefonstiv 123</p>
				<div
						className={`provider provider-custom`}
						style={{backgroundColor: this.props.background}}
				>
					{this.props.user}
				</div>
			</div>
		)
	}
}





