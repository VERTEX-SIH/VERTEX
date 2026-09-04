
import os

path = r'd:\on destop notes\RAMIAH STUFF\VERTEX\backend\services\classifier.py'
content = open(path, 'r', encoding='utf-8').read()

# Add facility data to source_data
injection = '''
        if classification_result:
            if not classification_result.source_data:
                classification_result.source_data = {}
            classification_result.source_data['osm_source'] = osm_context.osm_source
            if len(osm_context.nearby_facilities) > 0:
                fac = osm_context.nearby_facilities[0]
                classification_result.source_data['facility_name'] = fac.get('name')
                classification_result.source_data['facility_type'] = fac.get('type')
                classification_result.source_data['distance_m'] = fac.get('distance_m')
'''

# We need to inject this right before:
# risk_score, risk_level = calculate_risk_score(...)

old_code = '''        risk_score, risk_level = calculate_risk_score('''
new_code = injection + '''\n        risk_score, risk_level = calculate_risk_score('''

if old_code in content and 'osm_source' not in content:
    content = content.replace(old_code, new_code)
    open(path, 'w', encoding='utf-8').write(content)
    print('Updated classifier.py')
else:
    print('Failed to update classifier.py')

