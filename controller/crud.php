<?php

function table_format(Array $data)
{
    $rows = array();
    foreach ($data as $url => $label) {
        $rows[] = compact('url', 'label');
    }
    return $rows;
}

/**
 *  @preRoute Admin
 */
function admin_filter($args, $server)
{
    if (!$server['user'] || !$server['user']->isAdmin) {
        throw new RuntimeException("{$server->apiCall} requires a valid admin session");
    }
}

/**
 *  @preRoute Auth
 */
function auth_filter($args, $server)
{
    if (!$server['user']) {
        throw new RuntimeException("{$server->apiCall} requires a valid session");
    }
}



/**
 *  @initRequest
 */
function loaduser(Array $requests, $server)
{
    $session = $server['session'];
    $server['user'] = null;
    try {
        $user = $session->get('user_id');
        if (!empty($user)) {
            $server['user'] = User::findById($user);
        }
    } catch (\Exception $e) {}
}

/** 
 * @API info 
 */
function crud_info(Array $args, $server)
{
    $user = $server['user'];

    $tables = array(
        'blog' => 'Blog', 
        'helps' => 'Help', 
        'linuxdistros' => 'Linux distros', 
        'syncrelease' => 'MEGASync', 
        'corporate' => 'Corporate', 
        'team' => 'Team', 
    );

    if ($user && $user->isAdmin) {
        $tables['deploy_keys'] = 'Deploy Keys';
        $tables['deploy'] = 'Deploy';
        $permissions = $tables;
    } else {
        $permissions = array();
        foreach ($user->permissions as $key) {
            if (!empty($tables[$key])) {
                $permissions[$key] = $tables[$key];
            }
        }
    }

    return array(
        'tables' => table_format($permissions),
        'me' => $user,
    );
}

function get_value($value) {
    if (!is_array($value)) {
        return $value;
    }
    if (empty($value['__subclass'])) {
        foreach ($value as $key => $val) {
            $value[$key] = get_value($val);
        }
        return $value;
    }

    $object = new $value['__subclass'];
    foreach ($value as $key => $val) {
        $object->$key = get_value($val);
    }

    return $object;
}

/** 
 * @API delete_file
 * @Auth 
 */
function crud_remove_file(Array $args, $server)
{
    Model::setCurrentUser($server['user']);
    $table = $server['db']->getCollection($args['table']);
    $record = $table->getbyId($args['id']);
    $response = array();
    foreach ($record->{$args['field']} as $id => $file) {
        if ((string)$file->id === $args['fileId']) {
            unset($record->{$args['field']}[$id]);
        } else {
            $response[] = array('id' => (String)$file->id, 'mime' => $file->mime);
        }
    }
    $record->Save();

    return compact('response');
}

/** 
 * @API save 
 * @Auth
 */
function crud_save(Array $args, $server)
{
    Model::setCurrentUser($server['user']);
    $table = $server['db']->getCollection($args['table']);
    if ($args['id'] === 'new') {
        $record = new $args['table'];
    } else {
        $record = $table->getById($args['id']);
    }
    foreach ($args['data'] as $key => $value) {
        $record->$key = get_value($value);
    }

    if (empty($args['embed'])) {
        $server['db']->save($record);
    } else {
        $parent = $server['db']->getCollection($args['embed']['table'])
            ->getById($args['embed']['id']);
        $found = false;
        foreach ($parent->{$args['embed']['prop']} as $prop) {
            if ($prop->id === $record->id) {
                $found = true;
            }
        }
        if (!$found) {
            $parent->{$args['embed']['prop']}[] = $record;
        }
        $parent->save();
    }

    return ['done' => true];
}


/**
 * @API form
 * @Auth */
function crud_form(Array $args, $server)
{
    $table = $server['db']->getReflection($args['table']);
    $form  = array();

    $doc = array();
    if (!empty($args['id'])) {
        $doc = (array)$server['db']->getCollection($args['table'])->getById($args['id']);
    }
    if (!empty($args['row'])) {
        $doc = (array)$args['row'];
        $form[] = array(
            'type' => 'hidden',
            'label' => '',
            'name' => '__subclass',
            'value' => get_class($args['row']),
        );
    }

    $groups = array();

    foreach ($table['properties'] as $prop) {
        $ann   = $prop['annotation'];
        $ref   = $ann->getOne('Reference,ReferenceOne');
        $refMany = $ann->getOne('ReferenceMany');
        $label = $ann->getOne('label');
        $input = array(
            'type'  => 'text',
            'name'  => $prop['property'],
            'label' => $label ? $label->getArg(0) : ucfirst($prop['property']),
            'value' => array_key_exists($prop['property'], $doc) ? $doc[$prop['property']] : null, 
        );
        if ($input['value'] instanceof MongoDate) {
            $input['value'] = date('Y-m-d H:i:s', $input['value']->sec);
        }

        if ($ann->has('Id,ignore')) {
            continue;
        } else if ($ann->has('longtext')){
            $input['type'] = 'textarea';
        } else if ($ann->has('html')){
            $input['type'] = 'html';
        } else if ($ann->has('markdown')) {
            $input['type'] = 'markdown';
        } else if ($refMany && $refMany->getArg(0) === 'files') {
            $input['type']  = 'upload';
            $input['extra'] = $ann->getOne('expecttype') ? $ann->getOne('expecttype')->getArg(0) : '';
            $input['value'] = array();
            foreach ($doc[$prop['property']] as $sub) {
                $sub = $sub->getObject();
                if ($sub instanceof File) {
                    $input['value'][] = array(
                        'id' => (string)$sub->id,
                        'mime' => $sub->mime,
                    );
                }
            }
        } else if ($ann->has('referencemany')) {
            $input['type'] = 'children';
            $input['value'] = crud_list(
                array('table' => $refMany->getArg(0), 'rows' => $input['value']),
                $server
            );
        } else if ($ann->has('embedmany')) {
            $input['type'] = 'sub';
            $value = array();
            foreach ($doc[$prop['property']] as $sub) {
                if ($sub instanceof ActiveMongo2\Reference) {
                    $sub = $sub->getObject();
                }
                $value[] = array(
                    'id' => empty($sub->id) ? uniqid() : $sub->id, 
                    'form' => crud_form(['row' => $sub, 'table' => get_class($sub)], $server),
                );
            }
            $input['value'] = $value;
        } else if ($ref && $ref->getArg(0) === 'files') {
            if (empty($doc)) {
                // there is no `document` in the DB, 
                // uploads cannot be done until they save it first
                continue;
            }
            $input['type'] = 'file';
            if (!empty($doc[$prop['property']])) {
                $input['value'] = (string)$doc[$prop['property']]->id;
            }
            $input['extra'] = $ann->getOne('expecttype') ? $ann->getOne('expecttype')->getArg(0) : '';
        } else if ($ann->has('enum')) {
            $input['type']  = 'select';
            $input['values'] = $ann->getOne('enum')->getArgs();
        }

        if ($ann->has('group')) {
            $groupName = $ann->getOne('group')->getArg(0);
            if (empty($groups[$groupName])) {
                $groups[$groupName] = array(
                    'type' => 'inline',
                    'inputs' => array($input)
                );
                $form[] = &$groups[$groupName];
            } else {
                $groups[$groupName]['inputs'][] = $input;
            }
            continue;
        }

        $form[] = $input;
    }

    if (is_callable(array($args['table'], 'getInputs'))) {
        $form = $args['table']::getInputs($form, $doc);
    }

    return $form;
}

/**
 *  @API delete
 *  @Auth
 */
function crud_delete(Array $args, $server)
{
    Model::setCurrentUser($server['user']);
    if (!empty($args['parent']) && is_array($args['parent'])) {
        $parent = $server['db']->getCollection($args['parent'][0])
            ->getById($args['parent'][2]);
        foreach ($parent->{$args['parent'][1]} as $pos => $value) {
            if ($value->id == (string)$args['id']) {
                unset($parent->{$args['parent'][1]}[$pos]);
            }
        }
        $parent->save();
        $row = $server['db']->getCollection($args['table'])->getbyId($args['id']);
        $server['db']->delete($row);

        $args['rows'] = $parent->{$args['parent'][1]};
        return crud_list($args, $server);
    }
    $row = $server['db']->getCollection($args['table'])->getbyId($args['id']);
    $server['db']->delete($row);
    return crud_list($args, $server);
}

/**
 *  @API list
 *  @Auth
 */
function crud_list(Array $args, $server)
{
    $table = $server['db']->getCollection($args['table']);
    $page  = max(1, empty($args['page']) ? 1 : $args['page']);

    $reflection = $server['db']->GetReflection($args['table']);
    $fields     = array();
    $labels     = array();
    foreach ($reflection->properties('@list') as $list) {
        $fields[] = $list['property'];
        $labels[] = ucfirst($list['property']);
    }

    $records = !empty($args['rows']) ? $args['rows'] : $table->find(array(), $fields)->sort(array('_id' => -1));
    $info = "";
    foreach ($reflection['annotation'] as $annotation) {
        if ($annotation->getName() === 'info') {
            $info = $annotation->getArg(0);
        }
    }

    $return = array(
        'info' => $info,
        'pages' => !empty($args['rows']) ? ['pages' => [],] : $records->paginate($page, 10),
        'fields' => $fields,
        'table'  => $args['table'],
        'labels' => $labels,
        'records' => array(),
    );

    foreach ($records as $record) {
        $row = array(
            'id' => (string)$record->id,
        );
        foreach ($return['fields'] as $field) {
            $row[$field] = $record->$field;
        }
        $return['records'][] = $row;
    }

    return $return;
}
